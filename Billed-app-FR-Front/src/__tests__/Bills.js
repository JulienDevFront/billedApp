/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
//
import Bills from "../containers/Bills";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { formatDate, formatStatus } from "../app/format.js";

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		test("then the bill icon should be activated ", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
			document.body.innerHTML = `<div id="root"></div>`;
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			expect(screen.getByTestId("icon-window")).toHaveClass("active-icon");
		});

		test("then getBills method formats dates and handles a corrupted date", async () => {
			const fakeStore = {
				bills: () => ({
					list: () =>
						Promise.resolve([
							{ date: "2023-05-01", status: "accepted" },
							{ date: "not-a-date", status: "refused" },
						]),
				}),
			};
			const bills = new Bills({
				document,
				onNavigate,
				store: fakeStore,
				localStorage: window.localStorage,
			});
			const res = await bills.getBills();
			expect(res[0].date).toBe(formatDate("2023-05-01"));
			expect(res[0].status).toBe(formatStatus("accepted"));
			expect(res[1].status).toBe(formatStatus("refused"));
		});

		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});

		test("Then if I click on preview button I should see a bill preview", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
			document.body.innerHTML = BillsUI({ data: [bills[0]] });
			const onNavigate = (pathname) => (document.body.innerHTML = ROUTES({ pathname }));
			const store = null;
			const bill = new Bills({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});
			$.fn.modal = jest.fn();
			const buttonPreview = screen.getByTestId("icon-eye");
			const handleClickIconEye = jest.fn(() => bill.handleClickIconEye(buttonPreview));
			buttonPreview.addEventListener("click", handleClickIconEye);
			userEvent.click(buttonPreview);
			expect($.fn.modal).toHaveBeenCalledWith("show");
			const modale = document.querySelector("#modaleFile");
			expect(modale).toBeTruthy();
		});

		test("then if I click on 'new bill' navigate to New Bill", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
			document.body.innerHTML = BillsUI({ data: [] });
			const onNavigate = jest.fn((pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			});
			new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });
			const btn = screen.getByTestId("btn-new-bill");
			await userEvent.click(btn);
			expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
			expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
		});
	});
});
