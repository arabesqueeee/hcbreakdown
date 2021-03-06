sap.ui.define([
  "com/tsmc/hcbreakdown/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  'sap/ui/export/Spreadsheet',
  "sap/ui/core/Fragment",
  "sap/ui/model/Filter"
], function (Controller, JSONModel, MessageBox, MessageToast, Spreadsheet, Fragment, Filter) {
  "use strict";

  return Controller.extend("com.tsmc.hcbreakdown.controller.Main", {

    onInit: function () {

      //change local or cloud
      //this.local = false;
     //this.cloud = true;

      this.local = true;
      this.cloud = false;

      if (this.local) {
        this.url = "http://127.0.0.1:10019";
        sap.ui.getCore().userid = '800003';
      } else {
        this.url = "";
      }

      var obk1 = {
        "list": [{
          "Id": "",
          "Text": ""
        }, {
          "Id": "Q1",
          "Text": "第一季度"
        }, {
          "Id": "Q2",
          "Text": "第二季度"
        }, {
          "Id": "Q3",
          "Text": "第三季度"
        }, {
          "Id": "Q4",
          "Text": "第四季度"
        }]
      };
      this.getView().setModel(new JSONModel(obk1), "quarter");

      var obk3 = {
        "list": [{
          "Id": "01",
          "Text": "年度"
        }, {
          "Id": "02",
          "Text": "季度"
        }]
      };
      this.getView().setModel(new JSONModel(obk3), "status");
      this.getView().setModel(new JSONModel(obk3), "type");

      $.ajax({
        url: "/user-api/currentUser",
        method: "GET",
        dataType: "json",
        async: false,
        success: function (data) {
          sap.ui.getCore().userid = data.email;
        },
        error: function () {
        }
      });

      if (sap.ui.getCore().userid != undefined) {
        $.ajax(
          {
            url: this.url + "/ecuser/getEmpId/" + sap.ui.getCore().userid,
            method: "GET",
            dataType: "json",
            async: false,
            beforeSend: function (xhr) {
              xhr.setRequestHeader("Content-Type", "application/json");
            },
            success: function (data) {
              sap.ui.getCore().userid = data.result.empId;
            },
            error: function () {

            }
          });
      }
      var postBody = {};
      postBody.type = '01';
      postBody.empId = sap.ui.getCore().userid;
      var postJson = JSON.stringify(postBody);
      var that = this;
      $.ajax({
        url: this.url + "/ou/selectPeriod/ASTREQ",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var arrayRes = [];
            var list = {};
            for (var i = 0; i < data.result.length; i++) {
              var pieceJsn = {};
              pieceJsn.Id = data.result[i].year;
              pieceJsn.Text = data.result[i].year;
              arrayRes.push(pieceJsn);
            }

            list.list = arrayRes
            that.getView().setModel(new JSONModel(list), "yper");
          } else {
          }
        },
        error: function () {
        }
      });
      ////////////
      // set table visible
      this.byId("requestCollectionRefer").setVisible(false);
      this.byId("yrequestCollection").setVisible(false);
      this.byId("qrequestCollection").setVisible(false);
      //init Value state
      var vs = {
        state: "None"
      };

      this.getView().setModel(new JSONModel(vs), "vsdl");
      this.getView().setModel(new JSONModel(vs), "vsidl");
      
     
    },
    onSaveQReq:function(oEvent){
      var dialog = new sap.m.BusyDialog({
        text: "提交中"
      });
      var status = '';
      dialog.open();
      if (oEvent.getParameters("id").id.search("Draft") != -1) {
        status = '02';
      } else {
        status = '03';
      }
      var tableData = this.getView().getModel("qreq").getProperty("/OrgCollection");
     
      var postData = [], postLog = [];
      for (var i = 0; i < tableData.length; i++) {
        var pieceJsn = {}, pieceLog = {};
        pieceJsn.dlAdjBudget = tableData[i].dlAdjBudget;
        pieceJsn.dlAllowance = tableData[i].dlAllowance;
        pieceJsn.dlJustification = tableData[i].dlJustification;
        pieceJsn.dlReqBudget = tableData[i].dlReqBudget;
        pieceJsn.empId = tableData[i].empId;
        pieceJsn.idlAdjBudget = tableData[i].idlAdjBudget;
        pieceJsn.idlAllowance = tableData[i].idlAllowance;
        pieceJsn.idlJustification = tableData[i].idlJustification;
        pieceJsn.idlReqBudget = tableData[i].idlReqBudget;
        pieceJsn.lstUpdUsr = sap.ui.getCore().userid;
        pieceJsn.org = tableData[i].org;
        pieceJsn.quarter = tableData[i].quarter;
        pieceJsn.status = status; //02-Draft,03-Submit
        pieceJsn.type = tableData[i].type;
        pieceJsn.year = tableData[i].year;
        postData.push(pieceJsn);

        pieceLog.year = tableData[i].year;
        pieceLog.quarter = tableData[i].quarter;
        switch (pieceLog.quarter) {
          case 'Q1':
            pieceLog.effectiveDte = pieceLog.year + '-' + '01-01';
            break;
          case 'Q2':
            pieceLog.effectiveDte = pieceLog.year + '-' + '04-01';
            break;
          case 'Q3':
            pieceLog.effectiveDte = pieceLog.year + '-' + '07-01';
            break;
          case 'Q4':
            pieceLog.effectiveDte = pieceLog.year + '-' + '10-01';
            break;
          default:
        }
        pieceLog.org = tableData[i].org;
        pieceLog.type = "01";
        pieceLog.finalDL = this.custParseInt(tableData[i].dlReqBudget);
        pieceLog.finalIDL = this.custParseInt(tableData[i].idlReqBudget);
        pieceLog.lstUpdUsr = sap.ui.getCore().userid;
        postLog.push(pieceLog);

      }
      var postJson = JSON.stringify(postData);
      var postJsonLog = JSON.stringify(postLog);
      var that = this;
      $.ajax({
        url: this.url + "/ou/batchSave",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: true,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          dialog.close();
          MessageToast.show("保存成功");

         /*var tableData = that.getView().getModel("qreq").getProperty("/OrgCollection");
         for(var i=0; i<tableData.length;i++){
          tableData[i].status = '03';
         } */
         that.getView().getModel("qreq").setProperty("/OrgCollection",data.result);
         that.getView().getModel("qreq").refresh(); 
        },
        error: function () {
          dialog.close();
          MessageToast.show("保存失敗");
        }
      });

      //Batch save ouAdjust
      //暫存時不保存上季度數據
    /*  if (status == '03') {
        if (postLog.length > 0) {
          $.ajax({
            url: this.url + "/ouadjust/batchSave",
            method: "POST",
            dataType: "json",
            data: postJsonLog,
            async: false,
            beforeSend: function (xhr) {
              xhr.setRequestHeader("Content-Type", "application/json");
            },
            success: function (data) {
              
            },
            error: function () {
            }
          });
        }
      }*/
    },
    onSaveYearReq: function (oEvent) {
      var dialog = new sap.m.BusyDialog({
        text: "提交中"
      });
      var status = '';
      dialog.open();
      if (oEvent.getParameters("id").id.search("Draft") != -1) {
        status = '02';
      } else {
        status = '03';
      }
      var tableData =
        tableData = this.getView().getModel("yreq").getProperty("/OrgCollection");
      var postData = [], postLog = [];
      for (var i = 0; i < tableData.length; i++) {
        var pieceJsn = {}, pieceLog = {};
        pieceJsn.dlAdjBudget = tableData[i].dlAdjBudget;
        pieceJsn.dlAllowance = tableData[i].dlAllowance;
        pieceJsn.dlJustification = tableData[i].dlJustification;
        pieceJsn.dlReqBudget = tableData[i].dlReqBudget;
        pieceJsn.empId = tableData[i].empId;
        pieceJsn.idlAdjBudget = tableData[i].idlAdjBudget;
        pieceJsn.idlAllowance = tableData[i].idlAllowance;
        pieceJsn.idlJustification = tableData[i].idlJustification;
        pieceJsn.idlReqBudget = tableData[i].idlReqBudget;
        pieceJsn.lstUpdUsr = sap.ui.getCore().userid;
        pieceJsn.org = tableData[i].org;
        pieceJsn.quarter = tableData[i].quarter;
        pieceJsn.status = status; //02-Draft,03-Submit
        pieceJsn.type = tableData[i].type;
        pieceJsn.year = tableData[i].year;
        postData.push(pieceJsn);

        pieceLog.year = tableData[i].year;
        pieceLog.quarter = tableData[i].quarter;
        switch (pieceLog.quarter) {
          case 'Q1':
            pieceLog.effectiveDte = pieceLog.year + '-' + '01-01';
            break;
          case 'Q2':
            pieceLog.effectiveDte = pieceLog.year + '-' + '04-01';
            break;
          case 'Q3':
            pieceLog.effectiveDte = pieceLog.year + '-' + '07-01';
            break;
          case 'Q4':
            pieceLog.effectiveDte = pieceLog.year + '-' + '10-01';
            break;
          default:
        }
        pieceLog.org = tableData[i].org;
        pieceLog.type = "01";
        pieceLog.finalDL = this.custParseInt(tableData[i].dlReqBudget);
        pieceLog.finalIDL = this.custParseInt(tableData[i].idlReqBudget);
        pieceLog.lstUpdUsr = sap.ui.getCore().userid;
        postLog.push(pieceLog);

      }
      var postJson = JSON.stringify(postData);
      var postJsonLog = JSON.stringify(postLog);
      var that = this;
      $.ajax({
        url: this.url + "/ou/batchSave",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: true,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          dialog.close();
          MessageToast.show("保存成功");

        /* var tableData = that.getView().getModel("yreq").getProperty("/OrgCollection");
         for(var i=0; i<tableData.length;i++){
          tableData[i].status = '03';
         } */
         that.getView().getModel("yreq").setProperty("/OrgCollection",data.result);
         that.getView().getModel("yreq").refresh();
        },
        error: function () {
          dialog.close();
          MessageToast.show("保存失敗");
        }
      });

      //Batch save ouAdjust
      //暫存時不保存上季度數據
     /*if (status == '03') {
        if (postLog.length > 0) {
          $.ajax({
            url: this.url + "/ouadjust/batchSave",
            method: "POST",
            dataType: "json",
            data: postJsonLog,
            async: false,
            beforeSend: function (xhr) {
              xhr.setRequestHeader("Content-Type", "application/json");
            },
            success: function (data) {
              
            },
            error: function () {
            }
          });
        }
      }*/
    },
    typeChangeBreakDown: function (oEvent) {
      var type = this.getView().byId("comType").getSelectedItem().getKey();
      var postBody = {};
      postBody.type = type;
      postBody.empId = sap.ui.getCore().userid;
      var postJson = JSON.stringify(postBody);
      var that = this;
      $.ajax({
        url: this.url + "/ou/selectPeriod/BDOWN",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var arrayRes = [];
            var list = {};
            for (var i = 0; i < data.result.length; i++) {
              var pieceJsn = {};
              pieceJsn.period = data.result[i].year + data.result[i].quarter;
              arrayRes.push(pieceJsn);
            }

            list.list = arrayRes
            that.getView().setModel(new JSONModel(list), "bdperiod");
          } else {
          }
        },
        error: function () {
        }
      });

    },

    typeChangeReport: function () {

    },
    onFilterSelect: function (oEvent) {
      var sKey = oEvent.getParameter("key");
      if (sKey === 'qrequest') { // 季度提报

        var postBody = {};
        postBody.type = '02';
        postBody.empId = sap.ui.getCore().userid;
        var postJson = JSON.stringify(postBody);
        var that = this;
        $.ajax({
          url: this.url + "/ou/selectPeriod/ASTREQ",
          method: "POST",
          dataType: "json",
          data: postJson,
          async: false,
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
          },
          success: function (data) {
            if (data.success == true) {
              var arrayRes = [];
              var list = {};
              for (var i = 0; i < data.result.length; i++) {
                var pieceJsn = {};
                pieceJsn.Id = data.result[i].year + data.result[i].quarter;
                pieceJsn.Text = data.result[i].year + data.result[i].quarter;
                arrayRes.push(pieceJsn);
              }

              list.list = arrayRes
              that.getView().setModel(new JSONModel(list), "aper");
            } else {
            }
          },
          error: function () {
          }
        });
      }

    },
    checkNumber: function (oEvent) {
      var value = oEvent.getParameters("value").value;
      var reg = new RegExp("^[0-9]*$");
      if (!reg.test(value)) {
        oEvent.getSource().setValueState("Error");
      } else {
        oEvent.getSource().setValueState("None");
      }
    },
    quarterRequest: function (oEvent) {
      this.byId("requestCollectionRefer").setVisible(true);
      this.byId("qrequestCollection").setVisible(true);

      var selectedPeriod = this.getView().byId("comPeriodReq").getSelectedItem();
      var postBody = {};
      postBody.type = '02';
      postBody.empId = sap.ui.getCore().userid;
      postBody.year = selectedPeriod.getKey().substring(0, 4);
      postBody.quarter = selectedPeriod.getKey().substring(4, 6);

      var postJson = JSON.stringify(postBody);
      var that = this;
      $.ajax({
        url: this.url + "/ou/selectOUBySearchModelByType/ASTREQ",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            that.getView().setModel(new JSONModel(result), "qreq");
            that.getView().byId("qrequestCollection").setVisibleRowCount(data.result.length);
          } else {
          }
        },
        error: function () {
        }
      });
      //查着年度可参考的
      postBody = {};
      postBody.type = '01';
      postBody.empId = sap.ui.getCore().userid;
      postBody.year = selectedPeriod.getKey().substring(0, 4);
      postBody.quarter = selectedPeriod.getKey().substring(4, 6);
      postBody.staus = '05';
      postJson = JSON.stringify(postBody);
      $.ajax({
        url: this.url + "/ou/selectOUBySearchModelByType/ASTREQ",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            that.getView().setModel(new JSONModel(result), "yref");
            that.getView().byId("requestCollectionRefer").setVisibleRowCount(data.result.length);
          } else {
          }
        },
        error: function () {
        }
      });
    },
    onValueHelpBdOrgid: function (oEvent) {
      var sInputValue = oEvent.getSource().getValue();
      this.inputId = oEvent.getSource().getId();
      var type = this.byId("comType").getSelectedKey();
      var period = this.byId("bdinfoperiod").getSelectedKey();
      if (type == "" || period == "") {
        MessageToast.show("請輸入必填字段");
        return;
      }
      //read value help list
      var postBody = {};
      var that = this;
      postBody.empId = sap.ui.getCore().userid;
      postBody.type = type;
      postBody.year = period.substring(0, 4);
      postBody.quarter = period.substring(4, 6);
      if (postBody.type == '01') {
        postBody.staus = '03';
      } else if (postBody.type == '02') {
        postBody.status = '05';
      }
      var postJson = JSON.stringify(postBody);

      $.ajax({
        url: this.url + "/ou/selectOrgIdBd",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            that.getView().setModel(new JSONModel(result), "orgIdHelp");
          } else {
          }
        },
        error: function () {
        }
      });

      if (!this.BdOrgDialog) {
        this.BdOrgDialog = sap.ui.xmlfragment(this.getView().getId(),
          "com.tsmc.hcbreakdown.Dialog.OrgId",
          this
        );
        this.getView().addDependent(this.BdOrgDialog);
      }
      this.BdOrgDialog.open();

    },
    orgHelpQDialogCfm: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      var orgId = oSelectedItem.getBindingContext("orgIdHelp").getProperty().org;
      this.byId("qreqorgid").setValue(orgId);
      var year = oSelectedItem.getBindingContext("orgIdHelp").getProperty().year;
      var quarter = oSelectedItem.getBindingContext("orgIdHelp").getProperty().quarter;

      var that = this;
      var postBody = {};
      postBody.type = '02';
      postBody.empId = sap.ui.getCore().userid;
      postBody.year = year;
      postBody.quarter = quarter;
      postBody.org = orgId;

      var postJson = JSON.stringify(postBody);
      $.ajax({
        url: this.url + "/ou/selectOUBySearchModelByType/ASTREQ",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            that.getView().setModel(new JSONModel(result), "qreq");
            that.byId("qrequestCollection").setVisible(true);
          } else {
          }
        },
        error: function () {
        }
      });

    },
    orgHelpYearDialogCfm: function (oEvent) {

      var oSelectedItem = oEvent.getParameter("selectedItem");
      if(oSelectedItem == undefined){
        var orgId = this.byId("yreqorgid").getValue(); 
      }else{
        var orgId = oSelectedItem.getBindingContext("orgIdHelp").getProperty().org;
        this.byId("yreqorgid").setValue(orgId); 
      }
      

      var year = oSelectedItem.getBindingContext("orgIdHelp").getProperty().year;

      var that = this;
      var postBody = {};
      postBody.type = '01';
      postBody.empId = sap.ui.getCore().userid;
      postBody.year = year;
      postBody.org = orgId;

      var postJson = JSON.stringify(postBody);

      $.ajax({
        url: this.url + "/ou/selectOUBySearchModelByType/ASTREQ",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            that.getView().setModel(new JSONModel(result), "yreq");
            sap.ui.getCore().yreqData = JSON.parse(JSON.stringify(data.result));

            that.byId("yrequestCollection").setVisible(true);
            that.onYearCalculate();
          } else {
          }
        },
        error: function () {
        }
      });
    },
    bdPeriodChange:function(){
      this.orgHelpDialogConfirm();
    },

    orgHelpDialogConfirm: function (oEvent) {
      var period,orgId;
      if(oEvent == undefined){
        orgId = this.byId("bdorgid").getValue();
        period = this.byId("bdinfoperiod").getSelectedKey();
      }else{
        var oSelectedItem = oEvent.getParameter("selectedItem");
         orgId = oSelectedItem.getBindingContext("orgIdHelp").getProperty().org;
         period = oSelectedItem.getBindingContext("orgIdHelp").getProperty().year + oSelectedItem.getBindingContext("orgIdHelp").getProperty().quarter;
        this.byId("bdorgid").setValue(orgId);
      }
      var type = this.byId("comType").getSelectedKey();
      var that = this;
      $.ajax({
        url: this.url + "/breakDown/selectEmpBreakDownInfo/" + sap.ui.getCore().userid + "/" + type + "/" + orgId + "/" + period + "/INITIAL",
        method: "GET",
        dataType: "json",
        async: false,
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            // for (var i = 0; i < result.OrgCollection.length; i++) {
            //   result.OrgCollection[i].dltotal = result.OrgCollection[i].class1 + result.OrgCollection[i].class2;
            //   result.OrgCollection[i].idltotal = result.OrgCollection[i].class3 + result.OrgCollection[i].class4 + result.OrgCollection[i].class5 + result.OrgCollection[i].class6;
            // }
            // that.byId("bdeffectivedte").setSelectedItemId(data.result[0].effectiveDte);
            var effeJsn = {}, effeArray = [], pieceEffe = {};
            pieceEffe.dte = data.result[0].effectiveDte;
            effeArray.push(pieceEffe);
            effeJsn.list = effeArray;
            that.getView().setModel(new JSONModel(effeJsn), "effe");
            that.byId("bdeffectivedte").setSelectedKey(pieceEffe.dte);

            var compare = {};
            compare.bdLstUpdDte = data.result[0].lstUpdDte;
            compare.effectiveDte = data.result[0].effectiveDte;
            that.getView().setModel(new JSONModel(compare), "compare");
            that.getView().setModel(new JSONModel(result), "bd");
            if(that.getView().getModel("footer") !== undefined){
              that.getView().getModel("footer").setProperty("/class1", 0);
              that.getView().getModel("footer").setProperty("/class2", 0);
              that.getView().getModel("footer").setProperty("/class3", 0);
              that.getView().getModel("footer").setProperty("/class4", 0);
              that.getView().getModel("footer").setProperty("/class5", 0);
              that.getView().getModel("footer").setProperty("/class6", 0);
              that.getView().getModel("footer").setProperty("/dltotal", 0);
              that.getView().getModel("footer").setProperty("/idltotal", 0);
             
            }
           
            //set  
            that.getView().getModel("vsdl").setProperty("/state", "None");
            that.getView().getModel("vsidl").setProperty("/state", "None");
            that.bdCalculate();
          } else {
          }
        },
        error: function () {
        }
      });

      var postBody = {};
    //  postBody.year = oSelectedItem.getBindingContext("orgIdHelp").getProperty().year;
      //postBody.quarter = oSelectedItem.getBindingContext("orgIdHelp").getProperty().quarter;
      //postBody.org = oSelectedItem.getBindingContext("orgIdHelp").getProperty().org;
      postBody.year = period.substring(0,4);
      postBody.quarter = period.substring(4,6);
      postBody.org = orgId;
      postBody.type = this.getView().byId("comType").getSelectedKey();
      var postJson = JSON.stringify(postBody);

      //获取当前季度所有的breakdown的生效日期  
      $.ajax({
        url: this.url + "/ouadjust/selectOuAdjust",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var effeArray = [], pieceEffe = {}, pieceJsn = {};
            var sign = "";
            var compare = that.getView().getModel("compare").getData();
            if (data.result.length > 0) {
              for (var j = 0; j < data.result.length; j++) {
                if (data.result[j].effectiveDte == compare.effectiveDte) {
                  //已存在相同生效日期的数据，
                  pieceJsn = {}
                  pieceJsn = data.result[j];
                  that.getView().setModel(new JSONModel(pieceJsn), "bdinfo");
                  sign = "X";
                  if (data.result[j].lstUpdDte > compare.lstUpdDte) { //如果调整的日期大于breakdown的日期，则提示可能会有更新 

                    MessageToast.show("員額數量可能存在更新，請檢查！");
                  }
                }
                pieceEffe = {};
                pieceEffe.dte = data.result[j].effectiveDte;
                effeArray.push(pieceEffe);
              }
              var effeJsn = {};
              effeJsn.list = effeArray;
              that.getView().setModel(new JSONModel(effeJsn), "effe");


              var i = data.result.length;
              i = i - 1;
              var pieceJsn = data.result[i];
              if (sign == "") {
                that.getView().setModel(new JSONModel(pieceJsn), "bdinfo");
                that.byId("bdeffectivedte").setSelectedKey(pieceJsn.effectiveDte);
              }
              if (pieceJsn.effectiveDte > compare.effectiveDte) {
                MessageToast.show("存在新的生效日期的員額數量，請選擇新的生效日期進行下達！");
              }
            } else {
              //   that.getView().byId("bdeffectivedte").setSelectedKey(compare.effectiveDte);
              var effeJsn = {}, effeArray = [], pieceEffe = {};
              pieceEffe.dte = compare.effectiveDte;
              effeArray.push(pieceEffe);
              effeJsn.list = effeArray;
              that.getView().setModel(new JSONModel(effeJsn), "effe");
              that.byId("bdeffectivedte").setSelectedKey(compare.effectiveDte);
            }


          } else {

          }
        },
        error: function () {
        }
      });



    },
    bdCalculate: function (oEvent) {

      if (!this.decimalCheck()) {
        MessageToast.show("請輸入合法數字");
        return;
      }
      var tableData = this.getView().getModel("bd").getProperty("/OrgCollection");
      var footer = {
        class1: 0,
        class2: 0,
        class3: 0,
        class4: 0,
        class5: 0,
        class6: 0,
        dltotal: 0,
        idltotal: 0
      };
      //  var columnid = oEvent.getParameter("id");
      // var sign;

      for (var i = 0; i < tableData.length; i++) {
        if (tableData[i].class1 !== null) {
          footer.class1 = footer.class1 + parseInt(tableData[i].class1);
        }
        if (tableData[i].class2 !== null) {
          footer.class2 = footer.class2 + parseInt(tableData[i].class2);
        }
        if (tableData[i].class3 !== null) {
          footer.class3 = footer.class3 + parseInt(tableData[i].class3);
        }
        if (tableData[i].class4 !== null) {
          footer.class4 = footer.class4 + parseInt(tableData[i].class4);
        }
        if (tableData[i].class5 !== null) {
          footer.class5 = footer.class5 + parseInt(tableData[i].class5);
        }
        if (tableData[i].class6 !== null) {
          footer.class6 = footer.class6 + parseInt(tableData[i].class6);
        }

        var class1Value, class2Value, class3Value, class4Value, class5Value, class6Value;
        if (tableData[i].class1 !== '' && tableData[i].class1 !== null) {
          class1Value = parseInt(tableData[i].class1);
        } else {
          class1Value = 0;
        }
        if (tableData[i].class2 !== '' && tableData[i].class2 !== null) {
          class2Value = parseInt(tableData[i].class2);
        } else {
          class2Value = 0;
        }
        if (tableData[i].class3 !== '' && tableData[i].class3 !== null) {
          class3Value = parseInt(tableData[i].class3);
        } else {
          class3Value = 0;
        }
        if (tableData[i].class4 !== '' && tableData[i].class4 !== null) {
          class4Value = parseInt(tableData[i].class4);
        } else {
          class4Value = 0;
        }
        if (tableData[i].class5 !== '' && tableData[i].class5 !== null) {
          class5Value = parseInt(tableData[i].class5);
        } else {
          class5Value = 0;
        }
        if (tableData[i].class6 !== '' && tableData[i].class6 !== null) {
          class6Value = parseInt(tableData[i].class6);
        } else {
          class6Value = 0;
        }
        tableData[i].dltotal = class1Value + class2Value;
        tableData[i].idltotal = class3Value + class4Value + class5Value + class6Value;

      }
      this.getView().getModel("bd").setProperty("/OrgCollection", tableData);

      // var columnid = oEvent.getParameter("id");
      // var value;

      // if (oEvent.getParameter("value") !== '') {
      //   value = parseInt(oEvent.getParameter("value"));
      // } else {
      //   value = 0;
      // }
      // if (columnid.search("iclass1") != -1) {
      //   footer.class1 = footer.class1 + value;
      //   sign = 'Y';
      // } else if (columnid.search("iclass2") != -1) {
      //   footer.class2 = footer.class2 + value;
      //   sign = 'Y';
      // } else if (columnid.search("iclass3") != -1) {
      //   footer.class3 = footer.class3 + value;
      //   sign = 'N';
      // } else if (columnid.search("iclass4") != -1) {
      //   footer.class4 = footer.class4 + value;
      //   sign = 'N';
      // } else if (columnid.search("iclass5") != -1) {
      //   footer.class5 = footer.class5 + value;
      //   sign = 'N';
      // } else if (columnid.search("iclass6") != -1) {
      //   footer.class6 = footer.class6 + value;
      //   sign = 'N';
      // }

      //update dltotal and idl
      // var orgPath = oEvent.getSource().getBindingContext("bd").getPath();
      // var bdDetail = this.getView().getModel("bd").getProperty(orgPath);

      // var class1Value, class2Value, class3Value, class4Value, class5Value, class6Value;
      // if (bdDetail.class1 !== '' && bdDetail.class1 !== null) {
      //   class1Value = parseInt(bdDetail.class1);
      // } else {
      //   class1Value = 0;
      // }
      // if (bdDetail.class2 !== '' && bdDetail.class2 !== null) {
      //   class2Value = parseInt(bdDetail.class2);
      // } else {
      //   class2Value = 0;
      // }
      // if (bdDetail.class3 !== '' && bdDetail.class3 !== null) {
      //   class3Value = parseInt(bdDetail.class3);
      // } else {
      //   class3Value = 0;
      // }
      // if (bdDetail.class4 !== '' && bdDetail.class4 !== null) {
      //   class4Value = parseInt(bdDetail.class4);
      // } else {
      //   class4Value = 0;
      // }
      // if (bdDetail.class5 !== '' && bdDetail.class5 !== null) {
      //   class5Value = parseInt(bdDetail.class5);
      // } else {
      //   class5Value = 0;
      // }
      // if (bdDetail.class6 !== '' && bdDetail.class6 !== null) {
      //   class6Value = parseInt(bdDetail.class6);
      // } else {
      //   class6Value = 0;
      // }
      // if (sign == 'Y') {
      //   bdDetail.dltotal = value + class1Value + class2Value;
      // } else if (sign == 'N') {
      //   bdDetail.idltotal = value + class3Value + class4Value + class5Value + class6Value;
      // }
      footer.dltotal = footer.class1 + footer.class2;
      footer.idltotal = footer.class3 + footer.class4 + footer.class6 + footer.class5;

      // this.getView().getModel("bd").setProperty(orgPath, bdDetail);
      // tableData = this.getView().getModel("bd").getProperty("/OrgCollection");
      this.getView().setModel(new JSONModel(footer), "footer");

     // this.onValidCheck();

    },
    onValidCheck: function () {
      //compare

      var bdinfo = this.getView().getModel("bdinfo").getData();
      if (bdinfo.finalDLBreakdown !== null & bdinfo.finalDLBreakdown !== '') {
        var finalDLBreakdown = parseInt(bdinfo.finalDLBreakdown);
      } else {
        finalDLBreakdown = 0;
      }

      if (bdinfo.finalIDLBreakdown !== null & bdinfo.finalIDLBreakdown !== '') {
        var finalIDLBreakdown = parseInt(bdinfo.finalIDLBreakdown);
      } else {
        finalIDLBreakdown = 0;
      }
      var footer;
     // if (this.getView().getModel("footer") != undefined) {
     //   footer = this.getView().getModel("footer").getData();
     // } else {
        this.bdCalculate();
        footer = this.getView().getModel("footer").getData();
   //   }

      if (footer.idltotal > finalIDLBreakdown) {
        this.getView().getModel("vsidl").setProperty("/state", "Error")
        return false;
      } else {
        this.getView().getModel("vsidl").setProperty("/state", "None")
      }

      if (footer.dltotal > finalDLBreakdown) {
        this.getView().getModel("vsdl").setProperty("/state", "Error")
        return false;
      } else {
        this.getView().getModel("vsdl").setProperty("/state", "None")
      }

      return true;
    },
    onExceedCheck:function(){
      
      var sign = this.onValidCheck();
      if (sign == false) {
        MessageToast.show("檢查有誤");
        return;
      }
    },
    onSaveBd: function () {
      var sign = this.onValidCheck();
      if (sign == false) {
        MessageToast.show("無法保存");
        return;
      }
      if (!this.decimalCheck()) {
        MessageToast.show("請輸入合法數字");
        return;
      }
      var tableData = this.getView().getModel("bd").getProperty("/OrgCollection");
      var postData = [];
      var effectiveDte = this.getView().getModel("bdinfo").getData().effectiveDte;
      if (tableData.length > 0) {
        for (var i = 0; i < tableData.length; i++) {
          var pieceJsn = {};
          pieceJsn.year = tableData[i].year;
          pieceJsn.quarter = tableData[i].quarter;
          pieceJsn.org = tableData[i].orgId;
          pieceJsn.type = this.byId("comType").getSelectedKey();
          pieceJsn.class1 = tableData[i].class1;
          pieceJsn.class2 = tableData[i].class2;
          pieceJsn.class3 = tableData[i].class3;
          pieceJsn.class4 = tableData[i].class4;
          pieceJsn.class5 = tableData[i].class5;
          pieceJsn.class6 = tableData[i].class6;
          pieceJsn.effectiveDte = effectiveDte;
          pieceJsn.lst_upd_usr = 'WANGYQ';
          postData.push(pieceJsn);
        }
        var postJson = JSON.stringify(postData);
        $.ajax({
          url: this.url + "/breakDown/batchSave",
          method: "POST",
          dataType: "json",
          data: postJson,
          async: false,
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
          },
          success: function (data) {
            if (data.success == true) {
              MessageToast.show("保存成功");
            } else {
              MessageToast.show("保存失败");
            }
          },
          error: function () {
          }
        });
      }
    },

    onValueHelpYROrgid: function (oEvent) {
      var sInputValue = oEvent.getSource().getValue();
      this.inputId = oEvent.getSource().getId();
      var year = this.byId("comYearPrdReq").getSelectedKey();
      if (year !== null) {

        var postBody = {};
        var that = this;
        postBody.empId = sap.ui.getCore().userid;
        postBody.year = year;
        postBody.type = '01'
        postBody.org = sInputValue;

        var postJson = JSON.stringify(postBody);

        $.ajax({
          url: this.url + "/ou/selectOrgId",
          method: "POST",
          dataType: "json",
          data: postJson,
          async: false,
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
          },
          success: function (data) {
            if (data.success == true) {
              var result = {};
              result.OrgCollection = data.result;
              that.getView().setModel(new JSONModel(result), "orgIdHelp");
            } else {
            }
          },
          error: function () {
          }
        });

        if (!this.YearOrgDialog) {
          this.YearOrgDialog = sap.ui.xmlfragment(this.getView().getId(),
            "com.tsmc.hcbreakdown.Dialog.YearOrgId",
            this
          );
          this.getView().addDependent(this.YearOrgDialog);
        }
        this.YearOrgDialog.open();
      } else {
        //提示

      }
    },
    onValueHelpRptOrg: function (oEvent) {
      //get AST current responsible OU

      var postBody = {};
      var that = this;
      postBody.empId = sap.ui.getCore().userid;
      // postBody.type = '02';
      //postBody.year = period.substring(0, 4);
      //postBody.quarter = period.substring(4, 6);
      var postJson = JSON.stringify(postBody);
      $.ajax({
        url: this.url + "/ou/selectOrgIdRpt",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            that.getView().setModel(new JSONModel(result), "orgIdHelp");
          } else {
          }
        },
        error: function () {
        }
      });

      if (!this.RptIdDialog) {
        this.RptIdDialog = sap.ui.xmlfragment(this.getView().getId(),
          "com.tsmc.hcbreakdown.Dialog.RptId",
          this
        );
        this.getView().addDependent(this.RptIdDialog);
      }
      this.RptIdDialog.open();

    },
    RptConfirm: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      var orgId = oSelectedItem.getBindingContext("orgIdHelp").getProperty().org;
      var orgName = oSelectedItem.getBindingContext("orgIdHelp").getProperty().orgName;
      this.byId("orgid").setValue(orgId);
      this.byId("orgid").setDescription(orgName);
    },
    onSearch: function () {
      var dialog = new sap.m.BusyDialog({
        text: "查詢中"
        });
        dialog.open();
      //check 类型和年度
      var type = this.byId("comType1").getSelectedKey();
      var year = this.byId("year").getDateValue().getFullYear();
      var org = this.byId("orgid").getValue();
      var quarter = this.byId("quarterSelect").getSelectedKey();
      if (type == '') {
        this.byId("comType1").setValueState("Error");
        return;
      }
      var postBody = {};
      var that = this;
      postBody.year = year;
      postBody.quarter = quarter;
      postBody.type = type;
      postBody.org = org;
      postBody.empId = sap.ui.getCore().userid;
      var postJson = JSON.stringify(postBody);
      $.ajax({
        url: this.url + "/ou/selectOUBySearchModelRpt",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          dialog.close();
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            for (var i = 0; i < result.OrgCollection.length; i++) {
              result.OrgCollection[i].idlBudgetFinal = that.custParseInt(result.OrgCollection[i].lstIdlAdjust) +
                that.custParseInt(result.OrgCollection[i].idlReqBudget) +
                that.custParseInt(result.OrgCollection[i].idlAdjBudget);
              result.OrgCollection[i].dlBudgetFinal = result.OrgCollection[i].lstDlAdjust +
                that.custParseInt(result.OrgCollection[i].dlReqBudget) +
                that.custParseInt(result.OrgCollection[i].idlAdjBudget);
              result.OrgCollection[i].finalBudget = result.OrgCollection[i].idlBudgetFinal + result.OrgCollection[i].dlBudgetFinal;
            }
            that.getView().setModel(new JSONModel(result), "rpt");
          } else {
            MessageToast.show(data.message);
          }
        },
        error: function () {
          dialog.close();
        }
      });

    },
    custParseInt: function (num) {
      if (num == null || num == '' || num == undefined) {
        return 0;
      } else {
        return parseInt(num);
      }
    },
    custParse: function (num) {
      if (num == null || num == '') {
        return 0;
      } else {
        return num;
      }
    },
    onValueHelpQROrgid: function (oEvent) {
      //read value help list
      var period = this.byId("comPeriodReq").getSelectedKey();
      if (period !== null) {
        var postBody = {};
        var that = this;
        postBody.empId = sap.ui.getCore().userid;
        postBody.type = '02';
        postBody.year = period.substring(0, 4);
        postBody.quarter = period.substring(4, 6);
        postBody.org = oEvent.getParameter("value");
        var postJson = JSON.stringify(postBody);
        $.ajax({
          url: this.url + "/ou/selectOrgId",
          method: "POST",
          dataType: "json",
          data: postJson,
          async: false,
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-Type", "application/json");
          },
          success: function (data) {
            if (data.success == true) {
              var result = {};
              result.OrgCollection = data.result;
              that.getView().setModel(new JSONModel(result), "orgIdHelp");
            } else {
            }
          },
          error: function () {
          }
        });

        if (!this.QuarterOrgDialog) {
          this.QuarterOrgDialog = sap.ui.xmlfragment(this.getView().getId(),
            "com.tsmc.hcbreakdown.Dialog.QuarterOrgId",
            this
          );
          this.getView().addDependent(this.QuarterOrgDialog);
        }
        this.QuarterOrgDialog.open();

      } else {

      }

    },
    DepartmentInSearch: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oFilter = new Filter(
        "org",
        sap.ui.model.FilterOperator.Contains, sValue
      );
      oEvent.getSource().getBinding("items").filter([oFilter]);

    },
    onCopyFrom: function () {
      //get breakdown year quarter org 
      var postBody = {};
      var that = this;
      var bdinfo = this.getView().getModel("bdinfo").getData();
      postBody.org = this.byId("bdorgid").getValue();
      postBody.year = this.byId("bdinfoperiod").getSelectedKey().substring(0, 4);
      postBody.quarter = this.byId("bdinfoperiod").getSelectedKey().substring(4, 6);
      postBody.effectiveDte = this.byId("bdeffectivedte").getSelectedKey();
      var postJson = JSON.stringify(postBody);
      $.ajax({
        url: this.url + "/breakDown/getLstBd",
        method: "POST",
        dataType: "json",
        data: postJson,
        async: false,
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Content-Type", "application/json");
        },
        success: function (data) {
          var tableData = that.getView().getModel("bd").getProperty("/OrgCollection");
          for (var i = 0; i < tableData.length; i++) {
            for (var j = 0; j < data.result.length; j++) {
              if (tableData[i].orgId == data.result[j].org) {
                tableData[i].class1 = data.result[j].class1;
                tableData[i].class2 = data.result[j].class2;
                tableData[i].class3 = data.result[j].class3;
                tableData[i].class4 = data.result[j].class4;
                tableData[i].class5 = data.result[j].class5;
                tableData[i].class6 = data.result[j].class6;
                break;

              }
            }
          }
          var res = {};
          res.OrgCollection = tableData;
          that.getView().setModel(new JSONModel(res), "bd");

        },
        error: function () {
        }
      });
    },
    decimalCheck: function (oEvent) {
      var j = 0;
      var tableData = this.getView().getModel("bd").getProperty("/OrgCollection");
      for (var i = 0; i < tableData.length; i++) {
        if (this.isNumber(this.custParse(tableData[i].class1)) &&
          this.isNumber(this.custParse(tableData[i].class2)) &&
          this.isNumber(this.custParse(tableData[i].class3)) &&
          this.isNumber(this.custParse(tableData[i].class4)) &&
          this.isNumber(this.custParse(tableData[i].class5)) &&
          this.isNumber(this.custParse(tableData[i].class6))) {

        } else {
          return false;
        }

      }
      return true;
    },
    isNumber: function (num) {
      if (! /^\d+$/.test(num)) {
        return false;
      } else {
        return true;
      }

    },
    effectivedteChange: function (oEvent) {
      var effectiveDte = oEvent.getParameter("selectedItem").getKey();
      //得到org quarter type year
      var type = this.byId("comType").getSelectedKey();
      var period = this.byId("bdinfoperiod").getSelectedKey();
      var orgId = this.byId("bdorgid").getValue();

      var that = this;
      $.ajax({
        url: this.url + "/breakDown/selectEmpBreakDownInfo/" + sap.ui.getCore().userid + "/" + type + "/" + orgId + "/" + period + "/" + effectiveDte,
        method: "GET",
        dataType: "json",
        async: false,
        success: function (data) {
          if (data.success == true) {
            var result = {};
            result.OrgCollection = data.result;
            // for (var i = 0; i < result.OrgCollection.length; i++) {
            //   result.OrgCollection[i].dltotal = result.OrgCollection[i].class1 + result.OrgCollection[i].class2;
            //   result.OrgCollection[i].idltotal = result.OrgCollection[i].class3 + result.OrgCollection[i].class4 + result.OrgCollection[i].class5 + result.OrgCollection[i].class6;
            // }
            // that.byId("bdeffectivedte").setSelectedItemId(data.result[0].effectiveDte); 

            var compare = {};
            compare.bdLstUpdDte = data.result[0].lstUpdDte;
            compare.effectiveDte = data.result[0].effectiveDte;
            that.getView().setModel(new JSONModel(compare), "compare");

            if(that.getView().getModel("footer") !== undefined){
              that.getView().getModel("footer").setProperty("/class1", 0);
              that.getView().getModel("footer").setProperty("/class2", 0);
              that.getView().getModel("footer").setProperty("/class3", 0);
              that.getView().getModel("footer").setProperty("/class4", 0);
              that.getView().getModel("footer").setProperty("/class5", 0);
              that.getView().getModel("footer").setProperty("/class6", 0);
              that.getView().getModel("footer").setProperty("/dltotal", 0);
              that.getView().getModel("footer").setProperty("/idltotal", 0);
             
            }
            //set  
            that.getView().getModel("vsdl").setProperty("/state", "None");
            that.getView().getModel("vsidl").setProperty("/state", "None");
            that.bdCalculate();

          } else {
          }
        },
        error: function () {
        }
      });

    },
    onYearCalculate: function () {

      var dbData = sap.ui.getCore().yreqData;

      var tableData = this.getView().getModel("yreq").getProperty("/OrgCollection");
      for (var i = 0; i < tableData.length; i++) {
        
        tableData[i].idlBudgetProposal = tableData[i].lstIdlAdjust
          + this.custParseInt(tableData[i].idlReqBudget);
        tableData[i].dlBudgetProposal = tableData[i].lstDlAdjust
          + this.custParseInt(tableData[i].dlReqBudget);

        tableData[i].prosalBudget = tableData[i].idlBudgetProposal + tableData[i].dlBudgetProposal;

        //
      }
      this.getView().getModel("yreq").setProperty("/OrgCollection", tableData);


    },
    readLstAdjust: function (quarter, tableData) {
      var lstQuarter;
      if (quarter == "Q4") {
        lstQuarter = "Q3";
      } else if (quarter == "Q3") {
        lstQuarter = "Q2";
      } else if (quarter == "Q2") {
        lstQuarter = "Q1";
      }
      for (var i = 0; i < tableData.length; i++) {
        if (tableData[i].quarter == lstQuarter) {
          return tableData[i];
        } else {
          continue;
        }
      }
      return 0;
    },
    readDBData: function (quarter, tableData) {
      for (var i = 0; i < tableData.length; i++) {
        if (tableData[i].quarter == quarter) {
          return tableData[i];
        } else {
          continue;
        }
      }
      return 0;

    }
  });
});
