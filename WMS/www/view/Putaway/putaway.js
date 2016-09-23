appControllers.controller('PutawayListCtrl', [
    'ENV',
    '$scope',
    '$stateParams',
    '$state',
    '$timeout',
    '$ionicPopup',
    '$ionicLoading',
    '$cordovaBarcodeScanner',
    '$cordovaKeyboard',
    'ApiService',
    'PopupService',
    function (
        ENV,
        $scope,
        $stateParams,
        $state,
        $timeout,
        $ionicPopup,
        $ionicLoading,
        $cordovaBarcodeScanner,
        $cordovaKeyboard,
        ApiService,
        PopupService) {
        var popup = null;
        $scope.Rcbp1 = {};
        $scope.GrnNo = {};
        $scope.Imgr1s = [];
        $scope.Imgr2s = [];
        $scope.refreshRcbp1 = function (scanBusinessPartyName, BusinessPartyName) {
            if (is.not.undefined(BusinessPartyName) && is.not.empty(BusinessPartyName)) {
                var objUri = ApiService.Uri(true, '/api/wms/rcbp1');
                objUri.addSearch('BusinessPartyName', BusinessPartyName);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Rcbp1s = result.data.results;
                    if (is.equal(scanBusinessPartyName, 'scanBusinessPartyName')) {
                        if ($scope.Rcbp1s !== null && $scope.Rcbp1s.length > 0) {
                            $scope.Rcbp1.selected = $scope.Rcbp1s[0];
                            $scope.showImgr1($scope.Rcbp1.selected.BusinessPartyCode);
                        } else {
                            $scope.Imgr1s = [];
                            $scope.Imgr2s = [];
                        }
                    }
                });
            } else {
                $scope.Imgr1s = [];
                $scope.Imgr2s = [];
            }
        };
        $scope.refreshGrnNos = function (scanGrn, Grn) {
            if (is.not.undefined(Grn) && is.not.empty(Grn)) {
                var objUri = ApiService.Uri(true, '/api/wms/imgr1');
                objUri.addSearch('StatusCode', 'EXE');
                objUri.addSearch('GoodsReceiptNoteNo', Grn);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.GrnNos = result.data.results;
                    if (is.equal(scanGrn, 'scanGrn')) {
                        if ($scope.GrnNos !== null && $scope.GrnNos.length > 0) {
                            $scope.GrnNo.selected = $scope.GrnNos[0];
                            $scope.GoToDetail($scope.GrnNo.selected);
                        } else {}
                    }
                });
            } else {}
        };
        $scope.showImgr1 = function (Customer) {
            if (is.not.undefined(Customer) && is.not.empty(Customer)) {
                var objUri = ApiService.Uri(true, '/api/wms/imgr1');
                objUri.addSearch('StatusCode', 'EXE');
                objUri.addSearch('CustomerCode', Customer);
                ApiService.Get(objUri, true).then(function success(result) {
                    $scope.Imgr1s = result.data.results;
                });
            } else {
                $scope.Imgr1s = [];
            }
            if (!ENV.fromWeb) {
                $cordovaKeyboard.close();
            }
        };
        $scope.showDate = function (utc) {
            return moment(utc).format('DD-MMM-YYYY');
        };
        $scope.showImgr2 = function (blnGrn, GoodsReceiptNoteNo) {
            if (is.not.undefined(GoodsReceiptNoteNo) && is.not.empty(GoodsReceiptNoteNo)) {
                var objUri = ApiService.Uri(true, '/api/wms/imgr2/putaway');
                objUri.addSearch('GoodsReceiptNoteNo', GoodsReceiptNoteNo);
                ApiService.Get(objUri, true).then(function success(result) {
                    if (!blnGrn) {
                        $scope.GrnNos = $scope.Imgr1s;
                        $scope.GrnNo.selected = $scope.GrnNos[0];
                    }
                    $scope.Imgr1s = [];
                    $scope.Imgr2s = result.data.results;
                });
            } else {
                $scope.Imgr2s = [];
            }
            if (!ENV.fromWeb) {
                $cordovaKeyboard.close();
            }
        };
        $scope.returnMain = function () {
            $state.go('index.main', {}, {
                reload: true
            });
        };
        $scope.openCam = function (imgr2) {
            if (!ENV.fromWeb) {
                if (is.equal(imgr2, 'GrnNo')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.refreshGrnNos("scanGrn", imageData.text);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(imgr2, 'BusinessPartyName')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.refreshRcbp1("scanBusinessPartyName", imageData.text);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.Imgr2s[imgr2.LineItemNo - 1].StoreNo = imageData.text;
                        $('#txt-storeno-' + imgr2.LineItemNo).select();
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                }
            }
        };
        $scope.clearInput = function (imgr2) {
            $scope.Imgr2s[imgr2.LineItemNo - 1].StoreNo = '';
        };
        $scope.checkConfirm = function () {
            $ionicLoading.show();
            var blnDiscrepancies = false;
            for (var i = 0; i < $scope.Imgr2s.length; i++) {
                var imgr2 = {
                    TrxNo: $scope.Imgr2s[i].TrxNo,
                    LineItemNo: $scope.Imgr2s[i].LineItemNo,
                    ProductCode: $scope.Imgr2s[i].ProductCode,
                    StoreNo: $scope.Imgr2s[i].StoreNo
                };
                if (is.empty(imgr2.StoreNo)) {
                    console.log('Product (' + imgr2.ProductCode + ') has no Store No to putaway');
                    blnDiscrepancies = true;
                }
            }
            if (blnDiscrepancies) {
                $ionicLoading.hide();
                PopupService.Alert(popup, 'Some Products Has Not Yet Putaway').then();
            } else {
                confirm();
            }
        };
        $scope.GoToDetail = function (Imgr1) {
            if (Imgr1 != null) {
                $state.go('GrPutawayDetail', {
                    'CustomerCode': Imgr1.CustomerCode,
                    'TrxNo': Imgr1.TrxNo,
                    'GoodsReceiptNoteNo': Imgr1.GoodsReceiptNoteNo
                }, {
                    reload: true
                });
            }
        };
    }
]);

appControllers.controller('GrPutawayDetailCtrl', [
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
        var hmImgr2 = new HashMap();
        var hmImsn1 = new HashMap();
        $scope.Detail = {
            Customer: $stateParams.CustomerCode,
            GRN: $stateParams.GoodsReceiptNoteNo,
            TrxNo: $stateParams.TrxNo,
            Scan: {
                BarCode: '',
                SerialNo: '',
                StoreNo: '',
                Qty: 0
            },
            Impr1: {
                ProductCode: '',
                ProductDescription: ''
            },
            Imgr2s: {},
            Imgr2sDb: {}
        };
        $ionicModal.fromTemplateUrl('scan.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });
        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });
        var setScanQty = function (barcode, imgr2) {
            if (is.equal(imgr2.SerialNoFlag, 'Y')) {
                $scope.Detail.Scan.Qty = imgr2.ScanQty;
                $('#txt-sn').removeAttr('readonly');
            } else {
                imgr2.ScanQty += 1;
                imgr2.QtyStatus = '';
                hmImgr2.remove(barcode);
                hmImgr2.set(barcode, imgr2);
                var objImgr2 = {
                        ScanQty: imgr2.ScanQty,
                        QtyStatus: imgr2.QtyStatus
                    },
                    strFilter = 'TrxNo=' + imgr2.TrxNo + ' And LineItemNo=' + imgr2.LineItemNo;
                SqlService.Update('Imgr2_Putaway', objImgr2, strFilter).then();
                $scope.Detail.Scan = {
                    BarCode: '',
                    SerialNo: '',
                    Qty: imgr2.ScanQty
                };
            }
            $scope.$apply();
        };
        var showImpr = function (barcode) {
            if (hmImgr2.has(barcode)) {
                var imgr2 = hmImgr2.get(barcode);
                $scope.Detail.Impr1 = {
                    ProductCode: imgr2.ProductCode,
                    ProductDescription: imgr2.ProductDescription
                };
                setScanQty(barcode, imgr2);
            } else {
                PopupService.Alert(popup, 'Wrong BarCode');
            }
        };
        var setSnQty = function (barcode, imgr2) {
            imgr2.ScanQty += 1;
            imgr2.QtyStatus = '';
            hmImgr2.remove(barcode);
            hmImgr2.set(barcode, imgr2);
            var objImgr2 = {
                    ScanQty: imgr2.ScanQty,
                    QtyStatus: imgr2.QtyStatus
                },
                strFilter = 'TrxNo=' + imgr2.TrxNo + ' And LineItemNo=' + imgr2.LineItemNo;
            SqlService.Update('Imgr2_Putaway', objImgr2, strFilter).then();
            $scope.Detail.Scan.Qty = imgr2.ScanQty;
            $scope.Detail.Scan.SerialNo = '';
            $scope.$apply();
        };
        var showSn = function (sn) {
            if (is.not.empty(sn)) {
                var barcode = $scope.Detail.Scan.BarCode,
                    SnArray = null,
                    imgr2 = hmImgr2.get(barcode);
                var imsn1 = {
                    ReceiptNoteNo: $scope.Detail.GRN,
                    ReceiptLineItemNo: imgr2.LineItemNo,
                    IssueNoteNo: '',
                    IssueLineItemNo: 0,
                    SerialNo: sn,
                };
                if (hmImsn1.count() > 0 && hmImsn1.has(barcode)) {
                    SnArray = hmImsn1.get(barcode);
                    if (is.not.inArray(sn, SnArray)) {
                        SnArray.push(sn);
                        hmImsn1.remove(barcode);
                        hmImsn1.set(barcode, SnArray);
                    } else {
                        $scope.Detail.Scan.SerialNo = '';
                        $scope.$apply();
                        return;
                    }
                } else {
                    SnArray = new Array();
                    SnArray.push(sn);
                    hmImsn1.set(barcode, SnArray);
                }
                //db_add_Imsn1_Receipt( imsn1 );
                setSnQty(barcode, imgr2);
            }
        };
        $scope.openCam = function (type) {
            if (!ENV.fromWeb) {
                if (is.equal(type, 'BarCode')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.Detail.Scan.BarCode = imageData.text;
                        showImpr($scope.Detail.Scan.BarCode);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'StoreNo')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.Detail.Scan.StoreNo = imageData.text;
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'SerialNo')) {
                    if ($('#txt-sn').attr('readonly') != 'readonly') {
                        $cordovaBarcodeScanner.scan().then(function (imageData) {
                            $scope.Detail.Scan.SerialNo = imageData.text;
                            showSn($scope.Detail.Scan.SerialNo);
                        }, function (error) {
                            $cordovaToast.showShortBottom(error);
                        });
                    }
                }
            }
        };
        $scope.openModal = function () {
            $scope.modal.show();
            $ionicLoading.show();
            SqlService.Select('Imgr2_Putaway', '*').then(function (results) {
                $scope.Detail.Imgr2sDb = new Array();
                for (var i = 0; i < results.rows.length; i++) {
                    var imgr2 = {
                        TrxNo: results.rows.item(i).TrxNo,
                        LineItemNo: results.rows.item(i).LineItemNo,
                        ProductCode: results.rows.item(i).ProductCode,
                        GoodsReceiptNoteNo: results.rows.item(i).GoodsReceiptNoteNo,
                        BarCode: results.rows.item(i).BarCode,
                        ScanQty: results.rows.item(i).ScanQty > 0 ? results.rows.item(i).ScanQty : 0,
                        ActualQty: 0,
                        QtyStatus: results.rows.item(i).QtyStatus
                    };
                    switch (results.rows.item(i).DimensionFlag) {
                    case '1':
                        imgr2.ActualQty = results.rows.item(i).PackingQty;
                        break;
                    case '2':
                        imgr2.ActualQty = results.rows.item(i).WholeQty;
                        break;
                    default:
                        imgr2.ActualQty = results.rows.item(i).LooseQty;
                    }
                    $scope.Detail.Imgr2sDb.push(imgr2);
                }
                $ionicLoading.hide();
            }, function (error) {
                $ionicLoading.hide();
            });
        };
        $scope.StatusAll = ["", "Damaged", "Shortlanded", "Overlanded"];
        $scope.updateQtyStatus = function () {
            var len = $scope.Detail.Imgr2sDb.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    var Imgr2_PutawayFilter = "TrxNo='" + $scope.Detail.Imgr2sDb[i].TrxNo + "' and  LineItemNo='" + $scope.Detail.Imgr2sDb[i].LineItemNo + "' "; // not record
                    var objImgr2_Putaway = {
                        QtyStatus: $scope.Detail.Imgr2sDb[i].QtyStatus
                    };
                    SqlService.Update('Imgr2_Putaway', objImgr2_Putaway, Imgr2_PutawayFilter).then(function (res) {});
                }
            }
        }

        $scope.closeModal = function () {
            $scope.updateQtyStatus();
            $scope.Detail.Imgr2sDb = {};
            $scope.modal.hide();
        };

        $scope.returnList = function () {
            if ($ionicHistory.backView()) {
                $ionicHistory.goBack();
            } else {
                $state.go('putawayList', {}, {
                    reload: true
                });
            }
        };

        $scope.clearInput = function (type) {
            if (is.equal(type, 'BarCode') && is.not.empty($scope.Detail.Scan.BarCode)) {
                $scope.Detail.Scan = {
                    BarCode: '',
                    SerialNo: '',
                    StoreNo: '',
                    Qty: 0
                };
                $scope.Detail.Impr1 = {
                    ProductCode: '',
                    ProductDescription: ''
                };
                $('#txt-sn').attr('readonly', true);
            } else if (is.equal(type, 'SerialNo') && is.not.empty($scope.Detail.Scan.SerialNo)) {
                $scope.Detail.Scan.SerialNo = '';
            } else if (is.equal(type, 'StoreNo') && is.not.empty($scope.Detail.Scan.StoreNo)) {
                $scope.Detail.Scan.StoreNo = '';
            }
        };
        $scope.changeQty = function () {
            if (is.not.empty($scope.Detail.Scan.BarCode)) {
                if (hmImgr2.count() > 0 && hmImgr2.has($scope.Detail.Scan.BarCode)) {
                    var imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                    var promptPopup = $ionicPopup.show({
                        template: '<input type="number" ng-model="Detail.Scan.Qty">',
                        title: 'Enter Qty',
                        subTitle: 'Are you sure to change Qty manually?',
                        scope: $scope,
                        buttons: [{
                            text: 'Cancel'
                        }, {
                            text: '<b>Save</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                imgr2.ScanQty = $scope.Detail.Scan.Qty;
                                var obj = {
                                    ScanQty: imgr2.ScanQty
                                };
                                var strFilter = 'TrxNo=' + imgr2.TrxNo + ' And LineItemNo=' + imgr2.LineItemNo;
                                SqlService.Update('Imgr2_Putaway', obj, strFilter).then();
                            }
                        }]
                    });
                }
            }
        };
        $scope.checkConfirm = function () {
            $ionicLoading.show();
            SqlService.Select('Imgr2_Putaway', '*').then(function (results) {
                var len = results.rows.length;
                if (len > 0) {
                    var blnDiscrepancies = false;
                    for (var i = 0; i < len; i++) {
                        var imgr2 = {
                            TrxNo: results.rows.item(i).TrxNo,
                            GoodsReceiptNoteNo: results.rows.item(i).GoodsReceiptNoteNo,
                            LineItemNo: results.rows.item(i).LineItemNo,
                            ProductCode: results.rows.item(i).ProductCode,
                            ScanQty: results.rows.item(i).ScanQty,
                            BarCode: results.rows.item(i).BarCode,
                            QtyStatus: results.rows.item(i).QtyStatus,
                            QtyName: '',
                            Qty: 0
                        };
                        if (imgr2.BarCode != null && imgr2.BarCode.length > 0) {
                            switch (results.rows.item(i).DimensionFlag) {
                            case '1':
                                imgr2.Qty = results.rows.item(i).PackingQty;
                                imgr2.QtyName = 'PackingQty';
                                break;
                            case '2':
                                imgr2.Qty = results.rows.item(i).WholeQty;
                                imgr2.QtyName = 'WholeQty';
                                break;
                            default:
                                imgr2.Qty = results.rows.item(i).LooseQty;
                                imgr2.QtyName = 'LooseQty';
                            }
                            if (imgr2.Qty != imgr2.ScanQty) {
                                if (imgr2.Qty < imgr2.ScanQty && imgr2.QtyStatus != null && imgr2.QtyStatus === 'Overlanded') {
                                    hmImgr2.remove(imgr2.BarCode);
                                    hmImgr2.set(imgr2.BarCode, imgr2);
                                } else if (imgr2.Qty > imgr2.ScanQty && imgr2.QtyStatus != null && (imgr2.QtyStatus === 'Damaged' || imgr2.QtyStatus === 'Shortlanded')) {
                                    hmImgr2.remove(imgr2.BarCode);
                                    hmImgr2.set(imgr2.BarCode, imgr2);
                                } else {
                                    console.log('Product (' + imgr2.ProductCode + ') Qty not equal.');
                                    blnDiscrepancies = true;
                                }
                            }
                        } else {
                            blnDiscrepancies = true;
                        }
                    }
                    if (blnDiscrepancies) {
                        $ionicLoading.hide();
                        PopupService.Alert(popup, 'Discrepancies on Qty').then(function (res) {
                            $scope.openModal();
                        });
                    } else {
                        sendConfirm();
                    }
                } else {
                    $ionicLoading.hide();
                    PopupService.Info(popup, 'No Product In This GRN').then();
                }
            }, function (error) {
                $ionicLoading.hide();
                PopupService.Alert(popup, error.message).then();
            });
        };
        $scope.enter = function (ev, type) {
            if (is.equal(ev.keyCode, 13)) {
                if (is.null(popup)) {
                    if (is.equal(type, 'barcode')) {
                        showImpr($scope.Detail.Scan.BarCode);
                    } else if (is.equal(type, 'StoreNo')) {

                    } else {
                        showSn($scope.Detail.Scan.SerialNo);
                    }
                } else {
                    popup.close();
                    popup = null;
                }
                if (!ENV.fromWeb) {
                    $cordovaKeyboard.close();
                }
            }
        };
        var sendConfirm = function () {
            var userID = sessionStorage.getItem('UserId').toString();
            $ionicLoading.show();
            hmImgr2.forEach(function (value, key) {
                var barcode = key,
                    imgr2 = value,
                    SnArray = null,
                    SerialNos = '';
                if (is.equal(imgr2.SerialNoFlag, 'Y')) {
                    if (hmImsn1.count() > 0 && hmImsn1.has(barcode)) {
                        SnArray = hmImsn1.get(barcode);
                    }
                    for (var i in SnArray) {
                        SerialNos = SerialNos + ',' + SnArray[i];
                    }
                    SerialNos = SerialNos.substr(1, SerialNos.length);
                    var objUri = ApiService.Uri(true, '/api/wms/imsn1/create');
                    objUri.addSearch('ReceiptNoteNo', $scope.Detail.GRN);
                    objUri.addSearch('ReceiptLineItemNo', imgr2.LineItemNo);
                    objUri.addSearch('SerialNos=', SerialNos);
                    objUri.addSearch('Imgr2TrxNo', imgr2.TrxNo);
                    ApiService.Get(objUri, true).then(function success(result) {});
                }
                if (imgr2.QtyStatus != null && imgr2.QtyStatus != '' && imgr2.Qty != imgr2.ScanQty) {
                    var objUri = ApiService.Uri(true, '/api/wms/imgr2/qtyremark');
                    objUri.addSearch('LineItemNo', imgr2.LineItemNo);
                    objUri.addSearch('TrxNo', imgr2.TrxNo);
                    objUri.addSearch('GoodsReceiptNoteNo', imgr2.GoodsReceiptNoteNo);
                    objUri.addSearch('QtyRemarkQty', imgr2.ScanQty);
                    objUri.addSearch('QtyFieldName', imgr2.QtyName);
                    objUri.addSearch('UserId', userID);
                    objUri.addSearch('QtyRemark', imgr2.QtyStatus + ' LN:' + imgr2.LineItemNo + ' ' + imgr2.ProductCode + ' ' + imgr2.Qty + '>' + imgr2.ScanQty);
                    ApiService.Get(objUri, true).then(function success(result) {});
                }
                var objUriUpdate = ApiService.Uri(true, '/api/wms/imgr2/putaway/update');
                objUriUpdate.addSearch('StoreNo', imgr2.StoreNo);
                objUriUpdate.addSearch('TrxNo', imgr2.TrxNo);
                objUriUpdate.addSearch('LineItemNo', imgr2.LineItemNo);
                ApiService.Get(objUriUpdate, false).then(function success(result) {});
            });
            $ionicLoading.hide();
            PopupService.Info(popup, 'Comfirm Success').then(function () {
              $scope.returnList();
            });
        };
        var GetImgr2ProductCode = function (GoodsReceiptNoteNo) {
            var objUri = ApiService.Uri(true, '/api/wms/imgr2/putaway');
            objUri.addSearch('GoodsReceiptNoteNo', GoodsReceiptNoteNo);
            ApiService.Get(objUri, true).then(function success(result) {
                $scope.Detail.Imgr2s = result.data.results;
                //SqlService.Delete('Imsn1_Receipt').then(function(res){
                SqlService.Delete('Imgr2_Putaway').then(function (res) {
                    for (var i = 0; i < $scope.Detail.Imgr2s.length; i++) {
                        var objImgr2 = $scope.Detail.Imgr2s[i];
                        hmImgr2.set(objImgr2.BarCode, objImgr2);
                        SqlService.Insert('Imgr2_Putaway', objImgr2).then();
                    }
                });
            });
        };
        GetImgr2ProductCode($scope.Detail.GRN);
    }
]);
