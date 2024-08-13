sap.ui.define(
	["sap/ui/core/format/DateFormat", "sap/ui/core/ValueState"],
	function (DateFormat, ValueState) {
		"use strict";

		return {
			formatDate: function(sDate) {
				if (isNaN(new Date(sDate))) {
					return "";
				}
			    let dDate = new Date(sDate);
				let iDay = dDate.getDate() < 10 ? `0${dDate.getDate()}` : dDate.getDate();
				let iMonth = dDate.getMonth() + 1 < 10 ? `0${dDate.getMonth() + 1}` : dDate.getMonth() + 1;
				return `${iDay}.${iMonth}.${dDate.getFullYear()}`;
            }
		};
	}
);
