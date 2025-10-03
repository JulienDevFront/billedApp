export const formatDate = (dateStr) => {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return dateStr;
	const ye = new Intl.DateTimeFormat("fr-FR", { year: "2-digit" }).format(d);
	const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(d);
	const mo = d.toLocaleString("fr-FR", { month: "short" });
	const month = mo.charAt(0).toUpperCase() + mo.slice(1);
	const abbr = month.replace(/\.$/, "").slice(0, 3) + ".";
	return `${day}-${abbr}-${ye}`;
};

export const formatStatus = (status) => {
	switch (status) {
		case "pending":
			return "En attente";
		case "accepted":
			return "Accepté";
		case "refused":
			return "Refused";
	}
};
