sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox"
], function (Controller, MessageBox) {
	"use strict";

	return Controller.extend("by.mda.bn.penalties.controller.BaseController", {
		
		getRouter : function () {
			return this.getOwnerComponent().getRouter();
		},
		
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		getModelData: function (sModelName) {
			return this.getView().getModel(sModelName)?.getData();
		},

		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		parseList: function (vData) {
			if (vData === "[]") {
				return [];
			};
			return JSON.parse(vData);
		},

		showAndLogError: function (sFallbackKey, oError) {
			let sMessage;
			if (oError) {
				console.error(oError && oError.message);
			}
			try {
				const vErrorBody = JSON.parse(oError.message);
				const sErrorMessage = vErrorBody[0]?.VALUE;
				sMessage = this.getText("errorBaseText", [sErrorMessage]);
				MessageBox.error(sMessage);
			} catch (oCatchedError) {
				sMessage = `${this.getText(sFallbackKey)}: ${oError?.message}`;
				MessageBox.error(sMessage);
			}
		},

		showAndLogParsedError: function (oError, fnCallback = () => {}) {
			let sMessage;
			if (oError) {
				console.error(oError && oError.message);
			}
			try {
				const vErrorBody = this.parseList(oError.message);
				const sErrorMessage = vErrorBody[0]?.VALUE;
				MessageBox.error(sErrorMessage, {
					onClose: fnCallback
				});
			} catch (oCatchedError) {
				sMessage = `${oError?.message}`;
				MessageBox.error(sMessage, {
					onClose: fnCallback
				});
			}
		},

		showConfirmDialog: function(sMessage, sButtonAction) {
			return new Promise((resolve, reject) => {
				let bCompact = this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.confirm(
					sMessage, {
						actions: [sButtonAction, MessageBox.Action.CLOSE],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function(sAction) {
							if (sAction !== "CLOSE") {
								resolve();
							} else {
								reject();
							}
						}
					}
				);
			});
		},

		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getText: function (sKey, aParams = []) {
			return this.getResourceBundle().getText(sKey, aParams);
		},

		showAndLogParsedError: function (sFallbackKey, oError) {
			let sMessage;
			if (oError) {
				console.error(oError && oError.message);
			}
			try {
				const vErrorBody = JSON.parse(oError.message);
				const sErrorMessage = vErrorBody[0]?.VALUE;
				sMessage = this.getText("errorBaseText", [sErrorMessage]);
				MessageBox.error(sMessage);
			} catch (oCatchedError) {
				sMessage = `${this.getText(sFallbackKey)}: ${oError?.message}`;
				MessageBox.error(sMessage);
			}
		},

        _getSapClientParamForUrl: function (sUrl) {
			return sUrl;
			const sSapClientParam = `sap-client=400&sap-language=ru`;
			const sSapClientUrl = sUrl + (sUrl.includes("?") ? "&" : "?") + sSapClientParam;
			return sSapClientUrl;
		},

		_getToken: function () {
			const oHeader = {headers: {"x-csrf-token": "fetch"}}
			return new Promise((fnResolve, fnReject) => {
				fetch(this._getSapClientParamForUrl(`/zehs/zapi_checklist/`), {
					method: "GET",
					...oHeader
				}).then(oResponse => {
					fnResolve(oResponse.headers.get("x-csrf-token"));
				}).catch(oError => {
					fnReject(oError);
				})
			})
		},

		fetchDataWithoutBaseUrl: async function (sURL, sMethod = "GET", oOptions = {}) {
			let sToken = "";
			if (sMethod !== "GET") {
				sToken = await this._getToken();
			}
			return new Promise( (resolve, reject) => {
				if (sMethod !== "GET") {
					if (!oOptions.headers) {
						oOptions.headers = {};
					}
					oOptions.headers["x-csrf-token"] = sToken;
				}
				fetch(this._getSapClientParamForUrl(sURL), {
					...oOptions,
					method: sMethod
				}).then(oResponse => {
					if (!oResponse.ok) {
						reject(new Error(oResponse.statusText));
					}
					return oResponse.text();
				}).then(aData => {
					resolve(aData);
				}).catch(oError => {
					reject(oError);
				})
			});
		},

		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				this.getRouter().navTo("Default", {}, true);
			}
		}
		
	});

});