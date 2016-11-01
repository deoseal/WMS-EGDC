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
                        }
                    }
                });
            } else {
                $scope.Imgr1s = [];
            }
        };
        $scope.refreshGrnNos = function (scanGrn, Grn) {
            if (is.not.undefined(Grn) && is.not.empty(Grn)) {
                var objUri = ApiService.Uri(true, '/api/wms/imgr1');
                objUri.addSearch('StatusCode', 'USE');
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
                objUri.addSearch('StatusCode', 'USE');
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
                });
            } else {}
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
                }
            }
        };
        $scope.GoToDetail = function (Imgr1) {
            if (Imgr1 !== null) {
                $state.go('GrPutawayDetail', {
                    'CustomerCode': Imgr1.CustomerCode,
                    'TrxNo': Imgr1.TrxNo,
                    'GoodsReceiptNoteNo': Imgr1.GoodsReceiptNoteNo
                }, {
                    reload: true
                });
            }
        };

        $scope.clearInput = function (type) {
            if (is.equal(type, 'Customer')) {
                $scope.Rcbp1.selected= null;
                $scope.GrnNo.selected = null;
                $scope.showImgr1(null);
            } else if (is.equal(type, 'GrnNo')) {
                $scope.GrnNo.selected = null;
                $scope.showImgr2(null, null);
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
        $scope.StoreNo = "";
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
        $scope.OldBarCode = "";
        var UpdateInsertImgr2 = function (barcode, Type) {
            if (is.not.undefined(barcode) && is.not.null(barcode) && is.not.empty(barcode)) {
                if (hmImgr2.has(barcode)) {
                    if ($scope.OldBarCode === "" || $scope.OldBarCode != barcode) {
                        var imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                        SqlService.Select('Imgr2_Putaway', '*', "ProductIndex='" + imgr2.ProductIndex + "' AND StagingAreaFlag!='Y' AND ActualQty!=ScanQty").then(function (results) {
                            if (results.rows.length === 1) {
                                $scope.Detail.Scan.TrxNo = results.rows.item(0).TrxNo;
                                $scope.Detail.Scan.LineItemNo = results.rows.item(0).LineItemNo;
                                if (results.rows.item(0).NewBarCode === "") {
                                    var OjbImgr2 = {
                                        NewBarCode: $scope.Detail.Scan.BarCode
                                    };
                                    SqlService.Update('Imgr2_Putaway', OjbImgr2, "ProductIndex='" + imgr2.ProductIndex + "'").then(function (res) {
                                        if (Type === "B") {
                                            $scope.ShowImgr1Detail(barcode);
                                        } else {
                                            $scope.ShowImprDetailNotQty();
                                        }
                                        $scope.OldBarCode = $scope.Detail.Scan.BarCode;
                                    });
                                } else {
                                    if (Type === "B") {
                                        $scope.ShowImgr1Detail(barcode);
                                    } else {
                                        $scope.ShowImprDetailNotQty();
                                    }
                                    $scope.OldBarCode = $scope.Detail.Scan.BarCode;
                                }
                            } else {
                                SqlService.Select('Imgr2_Putaway', '*', " StagingAreaFlag!='Y' AND (BarCode1='" + $scope.Detail.Scan.BarCode + "' OR BarCode2='" + $scope.Detail.Scan.BarCode + "'  OR BarCode3='" + $scope.Detail.Scan.BarCode + "' )").then(function (results) {
                                    if (results.rows.length >= 1) {
                                        for (var i = 0; i < results.rows.length; i++) {
                                            if (results.rows.item(i).ActualQty != results.rows.item(i).ScanQty || i === results.rows.length - 1) {
                                                $scope.Detail.Scan.TrxNo = results.rows.item(i).TrxNo;
                                                $scope.Detail.Scan.LineItemNo = results.rows.item(i).LineItemNo;
                                                imgr2.TrxNo = results.rows.item(i).TrxNo;
                                                imgr2.LineItemNo = results.rows.item(i).LineItemNo;
                                                imgr2.NewBarCode = barcode;
                                                imgr2.ProductIndex = results.rows.item(i).ProductIndex;
                                                var objUpdate = {
                                                    NewBarCode: barcode
                                                };
                                                SqlService.Update('Imgr2_Putaway', objUpdate, "ProductIndex='" + imgr2.ProductIndex + "'").then(function (res) {
                                                    hmImgr2.remove(imgr2.NewBarCode);
                                                    hmImgr2.set(imgr2.NewBarCode, imgr2);
                                                    if (Type === "B") {
                                                        $scope.ShowImgr1Detail(barcode);
                                                    } else {
                                                        $scope.ShowImprDetailNotQty();
                                                    }
                                                    $scope.OldBarCode = $scope.Detail.Scan.BarCode;
                                                });
                                                break;
                                            }
                                        }
                                    }
                                    else{
                                          PopupService.Alert(popup, 'StagingAreaFlag Equal To Y');
                                    }
                                });
                            }
                        });
                    } else {
                        if (Type === "B") {
                            $scope.ShowImgr1Detail(barcode);
                        } else {
                            $scope.ShowImprDetailNotQty();
                        }
                    }
                } else {
                    PopupService.Alert(popup, 'Wrong BarCode');
                    $('#txt-barcode').select();
                }
            }
        };
        $scope.NewImgr2 = function () {
          $scope.setStoreNo();
            if (is.not.undefined($scope.Detail.Scan) && is.not.null($scope.Detail.Scan.BarCode) && is.not.empty($scope.Detail.Scan.BarCode)) {
                if (hmImgr2.has($scope.Detail.Scan.BarCode)) {
                    var imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                    SqlService.Select('Imgr2_Putaway', '*', "TrxNo='" + $scope.Detail.Scan.TrxNo + "' And LineItemNo='" + $scope.Detail.Scan.LineItemNo + "'").then(function (results) {
                        if (results.rows.length > 0) {
                            imgr2.ScanQty = 0;
                            for (var i = 0; i < results.rows.length; i++) {
                                if (results.rows.item(i).NewFlag === "") {
                                    imgr2.ScanQty = results.rows.item(i).Qty;
                                    break;
                                }
                            }
                            imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                            for (var i = 0; i < results.rows.length; i++) {
                                imgr2.ScanQty = imgr2.ScanQty - results.rows.item(i).ScanQty;
                                var objimgr2 = {
                                    ActualQty: results.rows.item(i).ScanQty
                                };
                                if( results.rows.item(i).Qty<=results.rows.item(i).ScanQty){
                                  objimgr2.ActualQty=results.rows.item(i).Qty;
                                }
                                SqlService.Update('Imgr2_Putaway', objimgr2, "ProductIndex=" + results.rows.item(i).ProductIndex).then();
                            }
                            if (imgr2.ScanQty < 0) {
                                imgr2.ScanQty = 0;
                            }
                            $scope.StoreNo = imgr2.DefaultStoreNo;
                            imgr2.StoreNo = $scope.StoreNo;
                            imgr2.ActualQty = imgr2.ScanQty;
                            if( imgr2.Qty<=imgr2.ScanQty){
                              imgr2.ActualQty =imgr2.Qty;
                            }
                            imgr2.NewBarCode = $scope.Detail.Scan.BarCode;
                            imgr2.NewFlag = "Y";
                            SqlService.Select('Imgr2_Putaway', '*').then(function (results1) {
                                imgr2.ProductIndex = results1.rows.length;
                                hmImgr2.remove(imgr2.NewBarCode);
                                hmImgr2.set(imgr2.NewBarCode, imgr2);
                                SqlService.Insert('Imgr2_Putaway', imgr2).then(function (res) {
                                    var barcode1 = $scope.Detail.Scan.BarCode;
                                    $scope.Detail.Scan = {
                                        BarCode: barcode1,
                                        SerialNo: '',
                                        ProductIndex: imgr2.ProductIndex,
                                        StoreNo: imgr2.StoreNo,
                                        TrxNo: imgr2.TrxNo,
                                        LineItemNo: imgr2.LineItemNo,
                                        Qty: imgr2.ScanQty
                                    };
                                    $scope.OldBarCode = $scope.Detail.Scan.BarCode;
                                });
                            });
                        }
                    });
                }
            }
        };

        var showImpr = function (barcode) {
            UpdateInsertImgr2(barcode, "B");
        };
        $scope.showImprk = function () {
            UpdateInsertImgr2($scope.Detail.Scan.BarCode, "K");
        };
        $scope.ShowImgr1Detail = function (barcode) {
            var imgr2 = hmImgr2.get(barcode);
            $scope.Detail.Impr1 = {
                ProductCode: imgr2.ProductCode,
                ProductDescription: imgr2.ProductDescription
            };
            setScanQty(barcode, imgr2);
        };
        $scope.ProductIndex = 0;
        var setScanQty = function (barcode, imgr2) {
            if (is.equal(imgr2.SerialNoFlag, 'Y')) {
                SqlService.Select('Imgr2_Putaway', '*', " ProductIndex='" + imgr2.ProductIndex + "'").then(function (results) {
                    if (results.rows.length === 1) {
                        imgr2.ScanQty = (results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0);
                        imgr2.StoreNo = results.rows.item(0).StoreNo;
                    }
                    imgr2.QtyStatus = '';
                    hmImgr2.remove(barcode);
                    hmImgr2.set(barcode, imgr2);
                    var barcode1 = barcode;
                    $scope.Detail.Scan = {
                        BarCode: barcode1,
                        SerialNo: '',
                        ProductIndex: imgr2.ProductIndex,
                        StoreNo: imgr2.StoreNo,
                        TrxNo: imgr2.TrxNo,
                        LineItemNo: imgr2.LineItemNo,
                        Qty: imgr2.ScanQty
                    };
                });
                $('#txt-sn').removeAttr('readonly');
            } else {
                SqlService.Select('Imgr2_Putaway', '*', "NewBarCode='" + barcode + "' And ProductIndex='" + imgr2.ProductIndex + "'").then(function (results) {
                    if (results.rows.length === 1) {
                        imgr2.ScanQty = (results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0);
                        imgr2.StoreNo = results.rows.item(0).StoreNo;
                    }
                    imgr2.ScanQty += 1;
                    imgr2.QtyStatus = '';
                    hmImgr2.remove(barcode);
                    hmImgr2.set(barcode, imgr2);
                    var objImgr2 = {
                            ScanQty: imgr2.ScanQty,
                            QtyStatus: imgr2.QtyStatus
                        },
                        strFilter = "NewBarCode='" + barcode + "' And ProductIndex='" + imgr2.ProductIndex + "'";
                    SqlService.Update('Imgr2_Putaway', objImgr2, strFilter).then();
                    var barcode1 = barcode;
                    $scope.Detail.Scan = {
                        BarCode: barcode1,
                        SerialNo: '',
                        ProductIndex: imgr2.ProductIndex,
                        StoreNo: imgr2.StoreNo,
                        TrxNo: imgr2.TrxNo,
                        LineItemNo: imgr2.LineItemNo,
                        Qty: imgr2.ScanQty
                    };
                });
            }
        };

        $scope.Onfocus = function (type) {
            if (is.equal(type, 'BarCode')) {
                $scope.setStoreNo();
                $('#txt-barcode').select();
            } else if (is.equal(type, 'StoreNo')) {
                $scope.ShowImprDetailNotQty();
                $('#txt-StoreNo').select();
            }
        };
        $scope.ShowImprDetailNotQty = function () {
            if ($scope.Detail.Scan.BarCode != $scope.OldBarCode) {
                var imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                SqlService.Select('Imgr2_Putaway', '*', "NewBarCode='" + $scope.Detail.Scan.BarCode + "'").then(function (results) {
                    if (results.rows.length === 1) {
                        imgr2.ScanQty = (results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0);
                        imgr2.StoreNo = $scope.StoreNo;
                    } else {
                        imgr2.NewBarCode = $scope.Detail.Scan.BarCode;
                    }
                    imgr2.QtyStatus = '';
                    hmImgr2.remove($scope.Detail.Scan.BarCode);
                    hmImgr2.set($scope.Detail.Scan.BarCode, imgr2);
                    var barcode1 = $scope.Detail.Scan.BarCode;
                    $scope.Detail.Scan = {
                        BarCode: barcode1,
                        SerialNo: '',
                        ProductIndex: imgr2.ProductIndex,
                        StoreNo: imgr2.StoreNo,
                        TrxNo: imgr2.TrxNo,
                        LineItemNo: imgr2.LineItemNo,
                        Qty: imgr2.ScanQty
                    };
                });
                if (is.equal(imgr2.SerialNoFlag, 'Y')) {
                    $('#txt-sn').removeAttr('readonly');
                }
            }
        };
        $scope.setStoreNo = function () {
            if ($scope.Detail.Scan !== null && is.not.empty($scope.Detail.Scan.StoreNo) && is.not.empty($scope.Detail.Scan.ProductIndex)) {
                $scope.StoreNo = $scope.Detail.Scan.StoreNo;
                var imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                imgr2.StoreNo = $scope.Detail.Scan.StoreNo;
                hmImgr2.remove($scope.Detail.Scan.BarCode);
                hmImgr2.set($scope.Detail.Scan.BarCode, imgr2);
                var objImgr2 = {
                    StoreNo: $scope.Detail.Scan.StoreNo
                };
                SqlService.Update('Imgr2_Putaway', objImgr2, "ProductIndex='" + $scope.Detail.Scan.ProductIndex + "'").then();
                $('#txt-barcode').select();
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
                strFilter = "NewBarCode='" + imgr2.BarCode + "' And ProductIndex='" + imgr2.ProductIndex + "'";
            SqlService.Update('Imgr2_Putaway', objImgr2, strFilter).then();
            $scope.Detail.Scan.Qty = imgr2.ScanQty;
            $scope.Detail.Scan.SerialNo = '';
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
                        $('#txt-barcode').select();
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'StoreNo')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.Detail.Scan.StoreNo = imageData.text;
                        $scope.setStoreNo();
                        if (ENV.parameter.showSerialNo) {
                            $('#txt-sn').select();
                        } else {
                            $('#txt-barcode').select();
                        }
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
            $scope.lost();
            SqlService.Select('Imgr2_Putaway', '*').then(function (results) {
                if (results.rows.length > 0) {
                    $scope.ShowModalDetail(results);
                } else {
                    SqlService.Select('Imgr2_Putaway', '*').then(function (results) {
                        $scope.ShowModalDetail(results);
                    }, function (error) {
                        $ionicLoading.hide();
                    });
                }
            }, function (error) {
                $ionicLoading.hide();
            });
        };
        $scope.ShowModalDetail = function (results) {
            $scope.Detail.Imgr2sDb = new Array();
            for (var i = 0; i < results.rows.length; i++) {
                var imgr2 = {
                    TrxNo: results.rows.item(i).TrxNo,
                    LineItemNo: results.rows.item(i).LineItemNo,
                    ProductCode: results.rows.item(i).ProductCode,
                    GoodsReceiptNoteNo: results.rows.item(i).GoodsReceiptNoteNo,
                    BarCode: results.rows.item(i).BarCode,
                    ScanQty: results.rows.item(i).ScanQty > 0 ? results.rows.item(i).ScanQty : 0,
                    StoreNo: results.rows.item(i).StoreNo,
                    ActualQty: results.rows.item(i).ActualQty,
                    ProductIndex: results.rows.item(i).ProductIndex,
                    QtyStatus: results.rows.item(i).QtyStatus
                };
                $scope.Detail.Imgr2sDb.push(imgr2);
            }
            $ionicLoading.hide();
        };
        $scope.StatusAll = ["", "Damaged", "Shortlanded", "Overlanded"];
        $scope.updateQtyStatus = function () {
            var len = $scope.Detail.Imgr2sDb.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    var Imgr2_PutawayFilter = " ProductIndex='" + $scope.Detail.Imgr2sDb[i].ProductIndex + "' "; // not record
                    var objImgr2_Putaway = {
                        QtyStatus: $scope.Detail.Imgr2sDb[i].QtyStatus,
                        StoreNo:$scope.Detail.Imgr2sDb[i].StoreNo,
                    };
                    if($scope.Detail.Scan.ProductIndex===$scope.Detail.Imgr2sDb[i].ProductIndex)
                    {
                      $scope.Detail.Scan.StoreNo=$scope.Detail.Imgr2sDb[i].StoreNo;
                    }
                    SqlService.Update('Imgr2_Putaway', objImgr2_Putaway, Imgr2_PutawayFilter).then(function (res) {});
                }
            }
        };
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
                    StoreNo: $scope.StoreNo,
                    Qty: 0
                };
                $scope.Detail.Impr1 = {
                    ProductCode: '',
                    ProductDescription: ''
                };
                $('#txt-sn').attr('readonly', true);
                $('#txt-barcode').select();
            } else if (is.equal(type, 'SerialNo') && is.not.empty($scope.Detail.Scan.SerialNo)) {
                $scope.Detail.Scan.SerialNo = '';
                $('#txt-sn').select();
            } else if (is.equal(type, 'StoreNo') && is.not.empty($scope.Detail.Scan.StoreNo)) {
                $scope.Detail.Scan.StoreNo = '';
                $('#txt-StoreNo').select();
            }
        };
        $scope.changeQty = function () {
            if (is.not.null($scope.Detail.Scan.BarCode) && is.not.empty($scope.Detail.Scan.BarCode)) {
                $scope.setStoreNo();
                $scope.showImprk();
                if (hmImgr2.count() > 0 && hmImgr2.has($scope.Detail.Scan.BarCode)) {
                    var imgr2 = hmImgr2.get($scope.Detail.Scan.BarCode);
                    var TempQty=  $scope.Detail.Scan.Qty;
                    var promptPopup = $ionicPopup.show({
                        template: '<input type="number" ng-model="Detail.Scan.Qty">',
                        title: 'Enter Qty',
                        subTitle: 'Are you sure to change Qty manually?',
                        scope: $scope,
                        buttons: [{
                            text: 'Cancel',
                            onTap: function(e){
                              // var TempQty=$scope.Detail.Scan.Qty;
                               $scope.Detail.Scan.Qty=TempQty;
                    }
                        }, {
                            text: '<b>Save</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                imgr2.ScanQty = $scope.Detail.Scan.Qty;
                                var obj = {
                                    StoreNo: $scope.Detail.Scan.StoreNo,
                                    ScanQty: imgr2.ScanQty
                                };
                                var strFilter = "NewBarCode='" + imgr2.BarCode + "' And ProductIndex='" + imgr2.ProductIndex + "'";
                                SqlService.Update('Imgr2_Putaway', obj, strFilter).then();
                            }
                        }]
                    });
                }
            }
        };
        $scope.checkConfirm = function (results) {
        var  hmImgr2Confirm = new HashMap();
            $scope.setStoreNo();
            SqlService.Select('Imgr2_Putaway', '*').then(function (results) {
                var len = results.rows.length;
                if (len > 0) {
                    var blnDiscrepancies = false;
                    for (var i = 0; i < len; i++) {
                        var imgr2 = {
                            ProductIndex: results.rows.item(i).ProductIndex,
                            TrxNo: results.rows.item(i).TrxNo,
                            LineItemNo: results.rows.item(i).LineItemNo,
                            DefaultStoreNo: results.rows.item(i).DefaultStoreNo,
                            StoreNo: results.rows.item(i).StoreNo,
                            StagingAreaFlag: results.rows.item(i).StagingAreaFlag,
                            ProductTrxNo: results.rows.item(i).ProductTrxNo,
                            ProductCode: results.rows.item(i).ProductCode,
                            ProductDescription: results.rows.item(i).ProductDescription,
                            UserDefine1: results.rows.item(i).UserDefine1,
                            NewBarCode: results.rows.item(i).NewBarCode,
                            BarCode: results.rows.item(i).BarCode,
                            BarCode1: results.rows.item(i).BarCode1,
                            BarCode2: results.rows.item(i).BarCode2,
                            BarCode3: results.rows.item(i).BarCode3,
                            DimensionFlag: results.rows.item(i).DimensionFlag,
                            GoodsReceiptNoteNo: results.rows.item(i).GoodsReceiptNoteNo,
                            PackingQty: results.rows.item(i).PackingQty,
                            WholeQty: results.rows.item(i).WholeQty,
                            LooseQty: results.rows.item(i).LooseQty,
                            Qty: results.rows.item(i).ActualQty,
                            ActualQty: results.rows.item(i).ActualQty,
                            SerialNoFlag:results.rows.item(i).SerialNoFlag,
                            ScanQty: results.rows.item(i).ScanQty,
                            QtyName:results.rows.item(i).QtyName,
                            QtyStatus:results.rows.item(i).QtyStatus,
                            NewFlag:results.rows.item(i).NewFlag
                        };
                        hmImgr2Confirm.set(imgr2.ProductIndex,imgr2);
                        if (imgr2.StoreNo !== null && imgr2.StoreNo.length > 0) {
                            if (imgr2.BarCode !== null && imgr2.BarCode.length > 0) {
                                switch (results.rows.item(i).DimensionFlag) {
                                case '1':
                                    imgr2.QtyName = 'PackingQty';
                                    break;
                                case '2':
                                    imgr2.QtyName = 'WholeQty';
                                    break;
                                default:
                                    imgr2.QtyName = 'LooseQty';
                                }
                                if (imgr2.Qty != imgr2.ScanQty) {
                                    if (imgr2.Qty < imgr2.ScanQty && imgr2.QtyStatus !==null && imgr2.QtyStatus === 'Overlanded') {
                                        hmImgr2.remove(imgr2.BarCode);
                                        hmImgr2.set(imgr2.BarCode, imgr2);
                                    } else if (imgr2.Qty > imgr2.ScanQty && imgr2.QtyStatus !== null && (imgr2.QtyStatus === 'Damaged' || imgr2.QtyStatus === 'Shortlanded')) {
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
                        } else {
                            // blnDiscrepancies = true;
                            $ionicLoading.hide();
                            PopupService.Alert(popup, 'Must enter the Store No').then(function (res) {
                            });
                        }
                    }
                    if (blnDiscrepancies) {
                        $ionicLoading.hide();
                        PopupService.Alert(popup, 'Discrepancies on Qty').then(function (res) {
                            $scope.openModal();
                        });
                    } else {
                        sendConfirm(hmImgr2Confirm);
                    }
                }
            });
        };
        $scope.lost=function(){
          $scope.setStoreNo();
          if (ENV.parameter.showSerialNo) {
              $('#txt-sn').select();
          } else {
              $('#txt-barcode').select();
          }
        };

        $scope.enter = function (ev, type) {
            if (is.equal(ev.keyCode, 13)) {
                if (is.null(popup)) {
                    if (is.equal(type, 'BarCode')) {
                        showImpr($scope.Detail.Scan.BarCode);
                        $('#txt-barcode').select();
                    } else if (is.equal(type, 'StoreNo')) {
                        $scope.setStoreNo();
                        if (ENV.parameter.showSerialNo) {
                            $('#txt-sn').select();
                        } else {
                            $('#txt-barcode').select();
                        }
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
        var sendConfirm = function (hmImgr2Confirm) {
            var userID = sessionStorage.getItem('UserId').toString();
            $ionicLoading.show();
            var StoreNoList = "";
            var QtyRemarkList = "";
            var LineItemNoList = "";
            var DimensionFlagList = "";
            var NewFlagList = "";
            var DimensionQtyList = "";
            var Imgr1TrxNo = 0;
            var GoodsReceiptNoteNo = "";
            var intUpdate = 0;
            hmImgr2Confirm.forEach(function (value, key) {
                var barcode = key,
                    imgr2 = value,
                    SnArray = null,
                    SerialNos = '';
                Imgr1TrxNo = imgr2.TrxNo;
                GoodsReceiptNoteNo = imgr2.GoodsReceiptNoteNo;

                if (is.equal(imgr2.SerialNoFlag, 'Y')) {
                    if (hmImsn1.count() > 0 && hmImsn1.has(imgr2.BarCode)) {
                        SnArray = hmImsn1.get(imgr2.BarCode);
                    }
                    for (var i in SnArray) {
                        SerialNos =SerialNos + ',' +  SnArray[i] ;
                    }
                    SerialNos = SerialNos.substr(1, SerialNos.length);
                    var objUri = ApiService.Uri(true, '/api/wms/imsn1/create');
                    objUri.addSearch('ReceiptNoteNo', $scope.Detail.GRN);
                    objUri.addSearch('ReceiptLineItemNo', imgr2.LineItemNo);
                    objUri.addSearch('SerialNos', SerialNos);
                    objUri.addSearch('Imgr2TrxNo', imgr2.TrxNo);
                    ApiService.Get(objUri, true).then(function success(result) {});
                }
                var QtyRemark = "";
                if (imgr2.QtyStatus !== null && imgr2.QtyStatus !== '' && imgr2.Qty != imgr2.ScanQty) {
                    QtyRemark = imgr2.QtyStatus + ' LN:' + imgr2.LineItemNo + ' ' + imgr2.ProductCode + ' ' + imgr2.Qty + '>' + imgr2.ScanQty;
                }
                if (intUpdate === 0) {
                    LineItemNoList = imgr2.LineItemNo;
                    DimensionFlagList = imgr2.DimensionFlag;
                    NewFlagList = imgr2.NewFlag;
                    DimensionQtyList = imgr2.ScanQty;
                    StoreNoList = imgr2.StoreNo;
                    QtyRemarkList = QtyRemark;
                    intUpdate = 1;
                } else {
                    LineItemNoList = LineItemNoList + ',' + imgr2.LineItemNo;
                    DimensionFlagList = DimensionFlagList + ',' + imgr2.DimensionFlag;
                    NewFlagList = NewFlagList + ',' + imgr2.NewFlag;
                    DimensionQtyList = DimensionQtyList + ',' + imgr2.ScanQty;
                    StoreNoList = StoreNoList + ',' + imgr2.StoreNo;
                    QtyRemarkList = QtyRemarkList + ',' + QtyRemark;
                }

            });
            var objUriUpdate = ApiService.Uri(true, '/api/wms/imgr2/putaway/update');
            objUriUpdate.addSearch('GoodsReceiptNoteNo', GoodsReceiptNoteNo);
            objUriUpdate.addSearch('TrxNo', Imgr1TrxNo);
            objUriUpdate.addSearch('QtyRemarkList', QtyRemarkList);
            objUriUpdate.addSearch('StoreNoList', StoreNoList);
            objUriUpdate.addSearch('LineItemNoList', LineItemNoList);
            objUriUpdate.addSearch('DimensionFlagList', DimensionFlagList);
            if (NewFlagList===""){
              NewFlagList="N";}
            objUriUpdate.addSearch('NewFlagList', NewFlagList);
            objUriUpdate.addSearch('DimensionQtyList', DimensionQtyList);
            objUriUpdate.addSearch('UserId', userID);
            ApiService.Get(objUriUpdate, false).then(function success(result) {});
            $ionicLoading.hide();
            PopupService.Info(popup, 'Confirm Success').then(function () {
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
                        if (objImgr2.StagingAreaFlag==="Y"){
                          objImgr2.ScanQty=objImgr2.Qty;
                        }
                        else {
                          objImgr2.StoreNo=objImgr2.DefaultStoreNo;
                        }
                        objImgr2.ProductIndex = i;
                        hmImgr2.set(objImgr2.BarCode, objImgr2);
                        hmImgr2.set(objImgr2.BarCode2, objImgr2);
                        hmImgr2.set(objImgr2.BarCode3, objImgr2);
                        SqlService.Insert('Imgr2_Putaway', objImgr2).then();
                    }
                });
            });
        };
        GetImgr2ProductCode($scope.Detail.GRN);
    }
]);
