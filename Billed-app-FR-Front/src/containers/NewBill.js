import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
	constructor({ document, onNavigate, store, localStorage }) {
		this.document = document;
		this.onNavigate = onNavigate;
		this.store = store;
		const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
		formNewBill.addEventListener("submit", this.handleSubmit);
		const file = this.document.querySelector(`input[data-testid="file"]`);
		file.addEventListener("change", this.handleChangeFile);
		this.fileUrl = null;
		this.fileName = null;
		this.billId = null;
		new Logout({ document, localStorage, onNavigate });
	}

	handleChangeFile = (e) => {
		e.preventDefault();
		const input = this.document.querySelector(`input[data-testid="file"]`);
		const file = input.files[0];

		const typeImageAccept = ["image/jpeg", "image/jpg", "image/png"];
		if (!typeImageAccept.includes(file.type)) {
			input.value = "";
			window.alert("The image is not good format");
			return;
		}
	};

	handleSubmit = async (e) => {
		e.preventDefault();

		const email = JSON.parse(localStorage.getItem("user")).email;

		if (!this.billId || !this.fileUrl) {
			const input = this.document.querySelector(`input[data-testid="file"]`);
			const file = input.files?.[0];
			const allowed = ["image/jpeg", "image/jpg", "image/png"];

			if (!file || !allowed.includes(file.type)) {
				window.alert("The image is not valid format.");
				return;
			}

			const formData = new FormData();
			formData.append("file", file);
			formData.append("email", email);

			try {
				const { fileUrl, key } = await this.store.bills().create({
					data: formData,
					headers: { noContentType: true },
				});
				this.fileUrl = fileUrl;
				this.fileName = file.name;
				this.billId = key;
			} catch (err) {
				console.error(err);
				window.alert("Erreur lors de l’upload du fichier.");
				return;
			}
		}

		const bill = {
			email,
			type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
			name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
			amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value, 10),
			date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
			vat: e.target.querySelector(`input[data-testid="vat"]`).value,
			pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value, 10) || 20,
			commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
			fileUrl: this.fileUrl,
			fileName: this.fileName,
			status: "pending",
		};

		await this.updateBill(bill);
		this.onNavigate(ROUTES_PATH["Bills"]);
	};

	// not need to cover this function by tests
	updateBill = (bill) => {
		if (this.store) {
			this.store
				.bills()
				.update({ data: JSON.stringify(bill), selector: this.billId })
				.then(() => {
					this.onNavigate(ROUTES_PATH["Bills"]);
				})
				.catch((error) => console.error(error));
		}
	};
}
