/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills";
jest.mock("../app/store", () => mockStore);

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
				onNavigate: () => {},
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

			const isoDates = screen
				.getAllByTestId("bill-date")
				.map((td) => td.getAttribute("data-date"));

			const sortedAsc = [...isoDates].sort((a, b) => b - a);
			expect(isoDates).toEqual(sortedAsc);
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

		test("then I can fetches bills from mock API GET", async () => {
			localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Dashboard);
			await waitFor(() => screen.getByText("Validations"));
			const contentPending = await screen.getByText("En attente (1)");
			expect(contentPending).toBeTruthy();
			const contentRefused = await screen.getByText("Refusé (2)");
			expect(contentRefused).toBeTruthy();
			expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
		});
	});
});
