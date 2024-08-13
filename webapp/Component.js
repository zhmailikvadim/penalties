sap.ui.define([
	"sap/ui/core/UIComponent"
], function (UIComponent) {
	"use strict";

	sap.ui.loader.config({
		paths: {
			"by/mda/bn/z_ehs_library_1": "/sap/bc/ui5_ui5/sap/z_ehs_library_1"
		}
	});

	return UIComponent.extend("by.mda.bn.penalties.Component", {

		metadata: {
			manifest: "json"
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
		}	
		
	});
});