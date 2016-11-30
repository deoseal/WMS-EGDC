appControllers.controller('cycleCountCtrl', [
    'ENV',
    '$scope',
    '$stateParams',
    '$state',
    '$cordovaKeyboard',
    'ApiService',
    function (
        ENV,
        $scope,
        $stateParams,
        $state,
        $cordovaKeyboard,
        ApiService) {
        $scope.Rcbp1 = {};
        $scope.TrxNo = {};
        $scope.Imcc1s = {};
        $scope.refreshRcbp1 = function (BusinessPartyName) {
            if (is.not.undefined(BusinessPartyName) && is.not.empty(BusinessPartyName)) {
                var objUri = ApiService.Uri(true, '/api/wms/rcbp1');
                objUri.addSearch('BusinessPartyName', BusinessPartyName);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Rcbp1s = result.data.results;
                });
            }
        };
        $scope.refreshTrxNos = function (Grn) {
            if (is.not.undefined(Grn) && is.not.empty(Grn)) {
                var objUri = ApiService.Uri(true, '/api/wms/imcc1');
                objUri.addSearch('TrxNo', Grn);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.TrxNos = result.data.results;
                });
            }
        };
        $scope.ShowImcc1 = function (Customer) {
            if (is.not.undefined(Customer) && is.not.empty(Customer)) {
                var objUri = ApiService.Uri(true, '/api/wms/imcc1');
                objUri.addSearch('CustomerCode', Customer);
                ApiService.Get(objUri, true).then(function success(result) {
                    $scope.Imcc1s = result.data.results;
                });
            }
            if (!ENV.fromWeb) {
                $cordovaKeyboard.close();
            }
        };
        $scope.showDate = function (utc) {
            return moment(utc).format('DD-MMM-YYYY');
        };
        $scope.GoToDetail = function (Imcc1) {
            if (Imcc1 !== null) {
                $state.go('cycleCountDetail', {
                    'CustomerCode': Imcc1.CustomerCode,
                    'TrxNo': Imcc1.TrxNo,
                }, {
                    reload: true
                });
            }
        };
        $scope.returnMain = function () {
            $state.go('index.main', {}, {
                reload: true
            });
        };
    }
]);

appControllers.controller('cycleCountDetailCtrl', [
    'ENV',
    '$scope',
    '$stateParams',
    '$state',
    '$http',
    '$timeout',
    '$ionicHistory',
    '$ionicLoading',
    '$ionicPopup',
    '$ionicModal',
    '$cordovaKeyboard',
    '$cordovaToast',
    '$cordovaBarcodeScanner',
    'SqlService',
    'ApiService',
    'PopupService',
    function (
        ENV,
        $scope,
        $stateParams,
        $state,
        $http,
        $timeout,
        $ionicHistory,
        $ionicLoading,
        $ionicPopup,
        $ionicModal,
        $cordovaKeyboard,
        $cordovaToast,
        $cordovaBarcodeScanner,
        SqlService,
        ApiService,
        PopupService) {
        var popup = null;
        var hmImcc2 = new HashMap();
        var hmImsn1 = new HashMap();
        $scope.Detail = {
            Customer: $stateParams.CustomerCode,
            TrxNo: $stateParams.TrxNo,
            Scan: {
                BarCode: '',
                SerialNo: '',
                Qty: 0
            },
            Imcc2: {
                CustBatchNo: ''
            },
            Impr1: {
                ProductCode: '',
                ProductDescription: ''
            },
            Imcc2s: {},
            Imcc2sDb: {}
        };
        // $ionicModal.fromTemplateUrl('scan.html', {
        //     scope: $scope,
        //     animation: 'slide-in-up'
        // }).then(function (modal) {
        //     $scope.modal = modal;
        // });
        // $scope.$on('$destroy', function () {
        //     $scope.modal.remove();
        // });
        // var setScanQty = function (barcode, Imcc2) {
        //     if (is.equal(Imcc2.SerialNoFlag, 'Y')) {
        //         $scope.Detail.Scan.Qty = Imcc2.ScanQty;
        //         $('#txt-sn').removeAttr('readonly');
        //     } else {
        //       SqlService.Select('Imcc2_Receipt', '*','TrxNo=' + Imcc2.TrxNo + ' And LineItemNo=' + Imcc2.LineItemNo).then(function (results) {
        //         if(results.rows.length===1)
        //         {
        //          Imcc2.ScanQty=(results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0 );
        //         }
        //         Imcc2.ScanQty += 1;
        //         Imcc2.QtyStatus='';
        //         hmImcc2.remove(barcode);
        //         hmImcc2.set(barcode, Imcc2);
        //         var barcode1 = barcode;
        //         var objImcc2 = {
        //                 ScanQty: Imcc2.ScanQty,
        //                 QtyStatus:Imcc2.QtyStatus
        //             },
        //             strFilter = 'TrxNo=' + Imcc2.TrxNo + ' And LineItemNo=' + Imcc2.LineItemNo;
        //         SqlService.Update('Imcc2_Receipt', objImcc2, strFilter).then();
        //         $scope.Detail.Scan = {
        //             BarCode: barcode1,
        //             SerialNo: '',
        //             Qty: Imcc2.ScanQty
        //         };
        //       })
        //     }
        // };
        // var showImpr = function (barcode) {
        //   if (is.not.undefined(barcode) && is.not.null(barcode) && is.not.empty(barcode))
        //   {
        //     if (hmImcc2.has(barcode)) {
        //         var Imcc2 = hmImcc2.get(barcode);
        //         $scope.Detail.Impr1 = {
        //             ProductCode: Imcc2.ProductCode,
        //             ProductDescription: Imcc2.ProductDescription
        //       };
        //         $scope.Detail.Imcc2.CustBatchNo = Imcc2.UserDefine1;
        //         setScanQty(barcode, Imcc2);
        //     } else {
        //         PopupService.Alert(popup, 'Wrong BarCode');
        //     }
        //   }
        // };
        // var setSnQty = function (barcode, Imcc2) {
        //   SqlService.Select('Imcc2_Receipt', '*', 'TrxNo=' + Imcc2.TrxNo + ' And LineItemNo=' + Imcc2.LineItemNo).then(function (results) {
        //     if(results.rows.length===1)
        //     {
        //       Imcc2.ScanQty=(results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0 );
        //     }
        //     Imcc2.ScanQty += 1;
        //     Imcc2.QtyStatus='';
        //     hmImcc2.remove(barcode);
        //     hmImcc2.set(barcode, Imcc2);
        //     var objImcc2 = {
        //             ScanQty: Imcc2.ScanQty,
        //             QtyStatus:Imcc2.QtyStatus
        //       },
        //         strFilter = 'TrxNo=' + Imcc2.TrxNo + ' And LineItemNo=' + Imcc2.LineItemNo;
        //     SqlService.Update('Imcc2_Receipt', objImcc2, strFilter).then();
        //     $scope.Detail.Scan.Qty = Imcc2.ScanQty;
        //     $scope.Detail.Scan.SerialNo = '';
        //   });
        // };
        // var showSn = function (sn) {
        //     if (is.not.empty(sn)) {
        //         var barcode = $scope.Detail.Scan.BarCode,
        //             SnArray = null,
        //             Imcc2 = hmImcc2.get(barcode);
        //         var imsn1 = {
        //             ReceiptNoteNo: $scope.Detail.GRN,
        //             ReceiptLineItemNo: Imcc2.LineItemNo,
        //             IssueNoteNo: '',
        //             IssueLineItemNo: 0,
        //             SerialNo: sn,
        //         };
        //         if (hmImsn1.count() > 0 && hmImsn1.has(barcode)) {
        //             SnArray = hmImsn1.get(barcode);
        //             if (is.not.inArray(sn, SnArray)) {
        //                 SnArray.push(sn);
        //                 hmImsn1.remove(barcode);
        //                 hmImsn1.set(barcode, SnArray);
        //             } else {
        //                 $scope.Detail.Scan.SerialNo = '';
        //                 return;
        //             }
        //         } else {
        //             SnArray = new Array();
        //             SnArray.push(sn);
        //             hmImsn1.set(barcode, SnArray);
        //         }
        //         //db_add_Imsn1_Receipt( imsn1 );
        //         setSnQty(barcode, Imcc2);
        //     }
        // };
        // $scope.openCam = function (type) {
        //     if (!ENV.fromWeb) {
        //         if (is.equal(type, 'BarCode')) {
        //             $cordovaBarcodeScanner.scan().then(function (imageData) {
        //                 $scope.Detail.Scan.BarCode = imageData.text;
        //                 showImpr($scope.Detail.Scan.BarCode);
        //             }, function (error) {
        //                 $cordovaToast.showShortBottom(error);
        //             });
        //         } else if (is.equal(type, 'SerialNo')) {
        //             if ($('#txt-sn').attr('readonly') != 'readonly') {
        //                 $cordovaBarcodeScanner.scan().then(function (imageData) {
        //                     $scope.Detail.Scan.SerialNo = imageData.text;
        //                     showSn($scope.Detail.Scan.SerialNo);
        //                 }, function (error) {
        //                     $cordovaToast.showShortBottom(error);
        //                 });
        //             }
        //         }
        //     }
        // };
        // $scope.openModal = function () {
        //     $scope.modal.show();
        //     $ionicLoading.show();
        //     SqlService.Select('Imcc2_Receipt', '*').then(function (results) {
        //         $scope.Detail.Imcc2sDb = new Array();
        //         for (var i = 0; i < results.rows.length; i++) {
        //             var Imcc2 = {
        //                 TrxNo: results.rows.item(i).TrxNo,
        //                 LineItemNo: results.rows.item(i).LineItemNo,
        //                 ProductCode: results.rows.item(i).ProductCode,
        //                 GoodsReceiptNoteNo: results.rows.item(i).GoodsReceiptNoteNo,
        //                 BarCode: results.rows.item(i).BarCode,
        //                 BarCode1: results.rows.item(i).BarCode1,
        //                 BarCode2: results.rows.item(i).BarCode2,
        //                 BarCode3: results.rows.item(i).BarCode3,
        //                 ScanQty: results.rows.item(i).ScanQty > 0 ? results.rows.item(i).ScanQty : 0,
        //                 ActualQty: 0,
        //                 QtyStatus: results.rows.item(i).QtyStatus
        //             };
        //             switch (results.rows.item(i).DimensionFlag) {
        //             case '1':
        //                 Imcc2.ActualQty = results.rows.item(i).PackingQty;
        //                 break;
        //             case '2':
        //                 Imcc2.ActualQty = results.rows.item(i).WholeQty;
        //                 break;
        //             default:
        //                 Imcc2.ActualQty = results.rows.item(i).LooseQty;
        //             }
        //             $scope.Detail.Imcc2sDb.push(Imcc2);
        //         }
        //         $ionicLoading.hide();
        //     }, function (error) {
        //         $ionicLoading.hide();
        //     });
        // };
        // $scope.StatusAll = ["", "Damaged", "Shortlanded", "Overlanded"];
        // $scope.updateQtyStatus = function () {
        //     var len = $scope.Detail.Imcc2sDb.length;
        //     if (len > 0) {
        //         for (var i = 0; i < len; i++) {
        //             var Imcc2_ReceiptFilter = "TrxNo='" + $scope.Detail.Imcc2sDb[i].TrxNo + "' and  LineItemNo='" + $scope.Detail.Imcc2sDb[i].LineItemNo + "' "; // not record
        //             var objImcc2_Receipt = {
        //                 QtyStatus: $scope.Detail.Imcc2sDb[i].QtyStatus
        //             };
        //             SqlService.Update('Imcc2_Receipt', objImcc2_Receipt, Imcc2_ReceiptFilter).then(function (res) {});
        //         }
        //     }
        // };
        //
        // $scope.closeModal = function () {
        //     $scope.updateQtyStatus();
        //     $scope.Detail.Imcc2sDb = {};
        //     $scope.modal.hide();
        // };
        //
        $scope.returnList = function () {
            if ($ionicHistory.backView()) {
                $ionicHistory.goBack();
            } else {
                $state.go('cycleCountList', {}, {
                    reload: false
                });
            }
        };
        //
        // $scope.clearInput = function (type) {
        //     if (is.equal(type, 'BarCode') && is.not.empty($scope.Detail.Scan.BarCode)) {
        //         $scope.Detail.Scan = {
        //             BarCode: '',
        //             SerialNo: '',
        //             Qty: 0
        //         };
        //         $scope.Detail.Impr1 = {
        //             ProductCode: '',
        //             ProductDescription: ''
        //         };
        //         $scope.Detail.Imcc2.CustBatchNo = '';
        //         $('#txt-sn').attr('readonly', true);
        //     } else if (is.equal(type, 'SerialNo') && is.not.empty($scope.Detail.Scan.SerialNo)) {
        //         $scope.Detail.Scan.SerialNo = '';
        //     }
        // };
        // $scope.changeQty = function () {
        //     if (is.not.null($scope.Detail.Scan.BarCode) && is.not.empty($scope.Detail.Scan.BarCode)) {
        //         if (hmImcc2.count() > 0 && hmImcc2.has($scope.Detail.Scan.BarCode)) {
        //             var Imcc2 = hmImcc2.get($scope.Detail.Scan.BarCode);
        //             var promptPopup = $ionicPopup.show({
        //                 template: '<input type="number" ng-model="Detail.Scan.Qty">',
        //                 title: 'Enter Qty',
        //                 subTitle: 'Are you sure to change Qty manually?',
        //                 scope: $scope,
        //                 buttons: [{
        //                     text: 'Cancel'
        //                 }, {
        //                     text: '<b>Save</b>',
        //                     type: 'button-positive',
        //                     onTap: function (e) {
        //                         var OldQty=Imcc2.ScanQty;
        //                         Imcc2.ScanQty = $scope.Detail.Scan.Qty;
        //                         var obj = {
        //                             ScanQty:ScanQty+ Imcc2.ScanQty- OldQty
        //                         };
        //                         var strFilter = 'TrxNo=' + Imcc2.TrxNo + ' And LineItemNo=' + Imcc2.LineItemNo;
        //                         SqlService.Update('Imcc2_Receipt', obj, strFilter).then();
        //                     }
        //                 }]
        //             });
        //         }
        //     }
        // };
        // $scope.checkConfirm = function () {
        //     $ionicLoading.show();
        //     SqlService.Select('Imcc2_Receipt', '*').then(function (results) {
        //         var len = results.rows.length;
        //         if (len > 0) {
        //             var blnDiscrepancies = false;
        //             for (var i = 0; i < len; i++) {
        //                 var Imcc2 = {
        //                     TrxNo: results.rows.item(i).TrxNo,
        //                     GoodsReceiptNoteNo: results.rows.item(i).GoodsReceiptNoteNo,
        //                     LineItemNo: results.rows.item(i).LineItemNo,
        //                     ProductCode: results.rows.item(i).ProductCode,
        //                     ScanQty: results.rows.item(i).ScanQty,
        //                     BarCode: results.rows.item(i).BarCode,
        //                     BarCode1: results.rows.item(i).BarCode1,
        //                     BarCode2: results.rows.item(i).BarCode2,
        //                     BarCode3: results.rows.item(i).BarCode3,
        //                     QtyStatus: results.rows.item(i).QtyStatus,
        //                     QtyName: '',
        //                     Qty: 0
        //                 };
        //                 if (Imcc2.BarCode != null && Imcc2.BarCode.length > 0) {
        //                     switch (results.rows.item(i).DimensionFlag) {
        //                     case '1':
        //                         Imcc2.Qty = results.rows.item(i).PackingQty;
        //                         Imcc2.QtyName = 'PackingQty';
        //                         break;
        //                     case '2':
        //                         Imcc2.Qty = results.rows.item(i).WholeQty;
        //                         Imcc2.QtyName = 'WholeQty';
        //                         break;
        //                     default:
        //                         Imcc2.Qty = results.rows.item(i).LooseQty;
        //                         Imcc2.QtyName = 'LooseQty';
        //                     }
        //                     if (Imcc2.Qty != Imcc2.ScanQty) {
        //                         if (Imcc2.Qty < Imcc2.ScanQty && Imcc2.QtyStatus != null && Imcc2.QtyStatus === 'Overlanded')
        //                         {
        //                           hmImcc2.remove(Imcc2.BarCode);
        //                           hmImcc2.set(Imcc2.BarCode, Imcc2);
        //                         }
        //                         else if (Imcc2.Qty > Imcc2.ScanQty && Imcc2.QtyStatus != null && (Imcc2.QtyStatus === 'Damaged' || Imcc2.QtyStatus === 'Shortlanded'))
        //                         {
        //                           hmImcc2.remove(Imcc2.BarCode);
        //                           hmImcc2.set(Imcc2.BarCode, Imcc2);
        //                         }
        //                         else {
        //                             console.log('Product (' + Imcc2.ProductCode + ') Qty not equal.');
        //                             blnDiscrepancies = true;
        //                         }
        //                     }
        //                 } else if (Imcc2.BarCode2 != null && Imcc2.BarCode2.length > 0) {
        //                     switch (results.rows.item(i).DimensionFlag) {
        //                     case '1':
        //                         Imcc2.Qty = results.rows.item(i).PackingQty;
        //                         Imcc2.QtyName = 'PackingQty';
        //                         break;
        //                     case '2':
        //                         Imcc2.Qty = results.rows.item(i).WholeQty;
        //                         Imcc2.QtyName = 'WholeQty';
        //                         break;
        //                     default:
        //                         Imcc2.Qty = results.rows.item(i).LooseQty;
        //                         Imcc2.QtyName = 'LooseQty';
        //                     }
        //                     if (Imcc2.Qty != Imcc2.ScanQty) {
        //                         if (Imcc2.Qty < Imcc2.ScanQty && Imcc2.QtyStatus != null && Imcc2.QtyStatus === 'Overlanded')
        //                         {
        //                           hmImcc2.remove(Imcc2.BarCode2);
        //                           hmImcc2.set(Imcc2.BarCode2, Imcc2);
        //                         }
        //                         else if (Imcc2.Qty > Imcc2.ScanQty && Imcc2.QtyStatus != null && (Imcc2.QtyStatus === 'Damaged' || Imcc2.QtyStatus === 'Shortlanded'))
        //                         {
        //                           hmImcc2.remove(Imcc2.BarCode2);
        //                           hmImcc2.set(Imcc2.BarCode2, Imcc2);
        //                         }
        //                         else {
        //                             console.log('Product (' + Imcc2.ProductCode + ') Qty not equal.');
        //                             blnDiscrepancies = true;
        //                         }
        //                     }
        //                 } else if (Imcc2.BarCode3 != null && Imcc2.BarCode3.length > 0) {
        //                     switch (results.rows.item(i).DimensionFlag) {
        //                     case '1':
        //                         Imcc2.Qty = results.rows.item(i).PackingQty;
        //                         Imcc2.QtyName = 'PackingQty';
        //                         break;
        //                     case '2':
        //                         Imcc2.Qty = results.rows.item(i).WholeQty;
        //                         Imcc2.QtyName = 'WholeQty';
        //                         break;
        //                     default:
        //                         Imcc2.Qty = results.rows.item(i).LooseQty;
        //                         Imcc2.QtyName = 'LooseQty';
        //                     }
        //                     if (Imcc2.Qty != Imcc2.ScanQty) {
        //                         if (Imcc2.Qty < Imcc2.ScanQty && Imcc2.QtyStatus != null && Imcc2.QtyStatus === 'Overlanded')
        //                         {
        //                           hmImcc2.remove(Imcc2.BarCode3);
        //                           hmImcc2.set(Imcc2.BarCode3, Imcc2);
        //                         }
        //                         else if (Imcc2.Qty > Imcc2.ScanQty && Imcc2.QtyStatus != null && (Imcc2.QtyStatus === 'Damaged' || Imcc2.QtyStatus === 'Shortlanded'))
        //                         {
        //                           hmImcc2.remove(Imcc2.BarCode3);
        //                           hmImcc2.set(Imcc2.BarCode3, Imcc2);
        //                         }
        //                         else {
        //                             console.log('Product (' + Imcc2.ProductCode + ') Qty not equal.');
        //                             blnDiscrepancies = true;
        //                         }
        //                     }
        //                 } else{
        //                     blnDiscrepancies = true;
        //                 }
        //             }
        //             if (blnDiscrepancies) {
        //                 $ionicLoading.hide();
        //                 PopupService.Alert(popup, 'Discrepancies on Qty').then(function (res) {
        //                     $scope.openModal();
        //                 });
        //             } else {
        //                 sendConfirm();
        //             }
        //         } else {
        //             $ionicLoading.hide();
        //             PopupService.Info(popup, 'No Product In This GRN').then();
        //         }
        //     }, function (error) {
        //         $ionicLoading.hide();
        //         PopupService.Alert(popup, error.message).then();
        //     });
        // };
        // $scope.enter = function (ev, type) {
        //     if (is.equal(ev.keyCode, 13)) {
        //         if (is.null(popup)) {
        //             if (is.equal(type, 'barcode')) {
        //                 showImpr($scope.Detail.Scan.BarCode);
        //             } else {
        //                 showSn($scope.Detail.Scan.SerialNo);
        //             }
        //         } else {
        //             popup.close();
        //             popup = null;
        //         }
        //         if (!ENV.fromWeb) {
        //             $cordovaKeyboard.close();
        //         }
        //     }
        // };
        // var sendConfirm = function () {
        //     var userID = sessionStorage.getItem('UserId').toString();
        //     hmImcc2.forEach(function (value, key) {
        //         var barcode = key,
        //             Imcc2 = value,
        //             SnArray = null,
        //             SerialNos = '';
        //         if (is.equal(Imcc2.SerialNoFlag, 'Y')) {
        //             if (hmImsn1.count() > 0 && hmImsn1.has(barcode)) {
        //                 SnArray = hmImsn1.get(barcode);
        //             }
        //             for (var i in SnArray) {
        //                 SerialNos = SerialNos + ',' + SnArray[i];
        //             }
        //             SerialNos = SerialNos.substr(1, SerialNos.length);
        //             var objUri = ApiService.Uri(true, '/api/wms/imsn1/create');
        //             objUri.addSearch('ReceiptNoteNo', $scope.Detail.GRN);
        //             objUri.addSearch('ReceiptLineItemNo', Imcc2.LineItemNo);
        //             objUri.addSearch('SerialNos', SerialNos);
        //             objUri.addSearch('Imcc2TrxNo', Imcc2.TrxNo);
        //             ApiService.Get(objUri, true).then(function success(result) {});
        //         }
        //         if (Imcc2.QtyStatus !== null && Imcc2.QtyStatus !== '' && Imcc2.Qty != Imcc2.ScanQty) {
        //             var objUri = ApiService.Uri(true, '/api/wms/Imcc2/qtyremark');
        //             objUri.addSearch('LineItemNo', Imcc2.LineItemNo);
        //             objUri.addSearch('TrxNo', Imcc2.TrxNo);
        //             objUri.addSearch('GoodsReceiptNoteNo', Imcc2.GoodsReceiptNoteNo);
        //             objUri.addSearch('QtyRemarkQty', Imcc2.ScanQty);
        //             objUri.addSearch('QtyFieldName', Imcc2.QtyName);
        //             objUri.addSearch('UserId', userID);   objUri.addSearch('QtyRemark', Imcc2.QtyStatus + ' LN:'+Imcc2.LineItemNo + ' ' + Imcc2.ProductCode + ' ' + Imcc2.Qty + '>'+Imcc2.ScanQty);
        //             ApiService.Get(objUri, true).then(function success(result) {});
        //         }
        //     });
        //     var objUri = ApiService.Uri(true, '/api/wms/Imcc1/confirm');
        //     objUri.addSearch('TrxNo', $scope.Detail.TrxNo);
        //     objUri.addSearch('UserId', userID);
        //     ApiService.Get(objUri, true).then(function success(result) {
        //         PopupService.Info(popup, 'Confirm Success').then(function (res) {
        //             $scope.returnList();
        //         });
        //     });
        // };
        var GetImcc2ProductTrxNo = function (TrxNo) {
            var objUri = ApiService.Uri(true, '/api/wms/imcc2');
            objUri.addSearch('TrxNo', TrxNo);
            ApiService.Get(objUri, true).then(function success(result) {
                $scope.Detail.Imcc2s = result.data.results;
                SqlService.Delete('Imcc2_CycleCount').then(function (res) {
                    for (var i = 0; i < $scope.Detail.Imcc2s.length; i++) {
                        var objImcc2 = $scope.Detail.Imcc2s[i];
                        SqlService.Insert('Imcc2_CycleCount', objImcc2).then();
                    }
                });
            });
        };
        GetImcc2ProductTrxNo($scope.Detail.TrxNo);
    }
]);
