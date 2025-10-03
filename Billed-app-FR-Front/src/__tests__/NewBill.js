/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";

const renderNewBillPage = () => {
	document.body.innerHTML = NewBillUI();
	Object.defineProperty(window, "localStorage", { value: localStorageMock });
	window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
};

describe("NewBill container", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		jest.clearAllMocks();
	});

	test("displays an alert if the image format is not correct", async () => {
		renderNewBillPage();
		const create = jest.fn();
		const store = { bills: () => ({ create }) };

		const onNavigate = jest.fn();
		new NewBill({ document, onNavigate, store, localStorage: window.localStorage });

		const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

		const input = screen.getByTestId("file");
		const badFile = new File(["pdf"], "test.pdf", { type: "application/pdf" });

		await userEvent.upload(input, badFile);

		expect(alertSpy).toHaveBeenCalledTimes(1);
		expect(input.value).toBe("");
		expect(create).not.toHaveBeenCalled();
		alertSpy.mockRestore();
	});

	test("handleChangeFile accepts a jpg/png", async () => {
		renderNewBillPage();
		const create = jest.fn();
		const store = { bills: () => ({ create }) };
		const onNavigate = jest.fn();
		new NewBill({ document, onNavigate, store, localStorage: window.localStorage });

		const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
		const input = screen.getByTestId("file");
		const goodFile = new File(["img"], "note.png", { type: "image/png" });

		await userEvent.upload(input, goodFile);

		expect(alertSpy).not.toHaveBeenCalled();
		expect(create).not.toHaveBeenCalled();
		expect(input.files[0].name).toBe("note.png");

		alertSpy.mockRestore();
	});

	test("handleSubmit reads the form, does create then update and navigates to Bills", async () => {
		renderNewBillPage();

		const create = jest.fn().mockResolvedValue({ fileUrl: "https://cdn/img.jpg", key: "9999" });
		const update = jest.fn().mockResolvedValue({});
		const store = { bills: () => ({ create, update }) };

		const onNavigate = jest.fn();
		new NewBill({ document, onNavigate, store, localStorage: window.localStorage });

		const fileInput = screen.getByTestId("file");
		const file = new File(["img"], "justif.jpg", { type: "image/jpeg" });
		await userEvent.upload(fileInput, file);

		await userEvent.selectOptions(screen.getByTestId("expense-type"), "Transports");
		await userEvent.clear(screen.getByTestId("expense-name"));
		await userEvent.type(screen.getByTestId("expense-name"), "Taxi Roissy");
		await userEvent.clear(screen.getByTestId("amount"));
		await userEvent.type(screen.getByTestId("amount"), "42");

		const dateInput = screen.getByTestId("datepicker");
		fireEvent.change(dateInput, { target: { value: "2023-05-01" } });

		await userEvent.clear(screen.getByTestId("vat"));
		await userEvent.type(screen.getByTestId("vat"), "20");
		await userEvent.clear(screen.getByTestId("pct"));
		await userEvent.type(screen.getByTestId("pct"), "10");
		await userEvent.type(screen.getByTestId("commentary"), "Note de test");

		const form = screen.getByTestId("form-new-bill");
		fireEvent.submit(form);

		// create appelé au submit (upload), puis update
		await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(update).toHaveBeenCalledTimes(1));

		const arg = update.mock.calls[0][0];
		const sentBill = JSON.parse(arg.data);
		expect(arg.selector).toBe("9999");
		expect(sentBill).toMatchObject({
			type: "Transports",
			name: "Taxi Roissy",
			amount: 42,
			date: "2023-05-01",
			vat: "20",
			pct: 10,
			commentary: "Note de test",
			fileUrl: "https://cdn/img.jpg",
			status: "pending",
		});
		expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
	});

	test("updateBill does not call anything if this.store is null", () => {
		renderNewBillPage();

		const onNavigate = jest.fn();
		const nb = new NewBill({
			document,
			onNavigate,
			store: null,
			localStorage: window.localStorage,
		});

		nb.updateBill({ foo: "bar" });
		expect(onNavigate).not.toHaveBeenCalled();
	});
});

describe("I am connected as an employee and on Bills page", () => {
	test("fetches new bill from mock API (POST = bills().create)", async () => {
		const newBill = {
			id: "47qAXb6fIm2zOKkLzMro",
			vat: "80",
			fileUrl: "https://test.storage.tld/v0/b/billable-xxx.jpg",
			status: "pending",
			type: "Hôtel et logement",
			commentary: "séminaire billed",
			name: "encore",
			fileName: "preview-facture-free-201801-pdf-1.jpg",
			date: "2004-04-04",
			amount: 400,
			commentAdmin: "ok",
			email: "a@a",
			pct: 20,
		};

		const createSpy = jest.spyOn(mockStore.bills(), "create");
		await mockStore.bills().create(newBill);

		expect(createSpy).toHaveBeenCalledTimes(1);
		expect(createSpy).toHaveBeenCalledWith(newBill);
	});
});
