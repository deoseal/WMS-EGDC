appControllers.controller('PickingListCtrl', [
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
        $scope.rcbp1 = {};
        $scope.GinNo = {};
        $scope.Imgi1s = {};
        $scope.refreshRcbp1 = function (BusinessPartyName) {
            if (is.not.undefined(BusinessPartyName) && is.not.empty(BusinessPartyName)) {
                var objUri = ApiService.Uri(true, '/api/wms/rcbp1');
                objUri.addSearch('BusinessPartyName', BusinessPartyName);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Rcbp1s = result.data.results;
                });
            }
        };
        $scope.refreshGinNos = function (Grn) {
            if (is.not.undefined(Grn) && is.not.empty(Grn)) {
                var objUri = ApiService.Uri(true, '/api/wms/imgi1');
                objUri.addSearch('GoodsIssueNoteNo', Grn);
                ApiService.Get(objUri, true).then(function success(result) {
                    $scope.GinNos = result.data.results;
                });
            }
        };
        $scope.ShowImgi1 = function (CustomerCode) {
            var objUri = ApiService.Uri(true, '/api/wms/imgi1');
            objUri.addSearch('CustomerCode', CustomerCode);
            ApiService.Get(objUri, true).then(function success(result) {
                $scope.Imgi1s = result.data.results;
            });
            if (!ENV.fromWeb) {
                $cordovaKeyboard.close();
            }
        };
        $scope.showDate = function (utc) {
            return moment(utc).format('DD-MMM-YYYY');
        };
        $scope.GoToDetail = function (Imgi1) {
            if (Imgi1 !== null) {
                $state.go('pickingDetail', {
                    'CustomerCode': Imgi1.CustomerCode,
                    'TrxNo': Imgi1.TrxNo,
                    'GoodsIssueNoteNo': Imgi1.GoodsIssueNoteNo
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

appControllers.controller('PickingDetailCtrl', [
    'ENV',
    '$scope',
    '$stateParams',
    '$state',
    '$timeout',
    '$ionicPlatform',
    '$ionicHistory',
    '$ionicPopup',
    '$ionicModal',
    '$ionicLoading',
    '$cordovaToast',
    '$cordovaBarcodeScanner',
    'ApiService',
    'SqlService',
    'PopupService',
    function (
        ENV,
        $scope,
        $stateParams,
        $state,
        $timeout,
        $ionicPlatform,
        $ionicHistory,
        $ionicPopup,
        $ionicModal,
        $ionicLoading,
        $cordovaToast,
        $cordovaBarcodeScanner,
        ApiService,
        SqlService,
        PopupService) {
        var popup = null;
        var hmImgi2 = new HashMap();
        var hmImsn1 = new HashMap();
        var hmImgi3 = new HashMap();
        $scope.Detail = {
            Customer: $stateParams.CustomerCode,
            GIN: $stateParams.GoodsIssueNoteNo,
            QtyName: '',
            DetailPackingNoList: '',
            Scan: {
                StoreNo: '',
                BarCode: '',
                SerialNo: '',
                Qty: 0,
                PackingNo: ''
            },
            Imgi2: {
                RowNum: 0,
                TrxNo: 0,
                LineItemNo: 0,
                StoreNo: '',
                ProductCode: '',
                ProductDescription: '',
                SerialNoFlag: '',
                BarCode: '',
                PackingNo: '',
                Qty: 0,
                QtyBal: 0
            },
            Imgi3: {},

            Imgi2s: {},
            Imgi2sDb: {},
            Imsn1s: {},
            blnNext: true,

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

        $ionicModal.fromTemplateUrl('Imgi3.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalImgi3 = modal;
        });
        $scope.$on('$destroy', function () {
            $scope.modalImgi3.remove();
        });
        $scope.ListImgi3 = function (imgi3) {
            SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + imgi3.LineItemNo).then(function (results) {
                var len = results.rows.length;
                // var intQty = 0;
                if (len > 0) {
                    getImgi3(imgi3.LineItemNo);
                } else {
                    PopupService.Info(popup, 'No Split record').then(function (res) {});
                }
            });
        };
        $scope.openModalImgi3 = function (imgi2) {
            if ($scope.Detail.Scan.PackingNo !== '' && $scope.Detail.Scan.Qty > 0) {
                SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + imgi2.LineItemNo).then(function (results) {
                    var len = results.rows.length;
                    RowNumber = len;
                    var intQty = 0;
                    if (len > 0) {
                        for (var i = 0; i < len; i++) {
                            intQty = intQty + results.rows.item(i).Qty;
                        }
                        intQty = $scope.Detail.Scan.Qty + intQty;
                        if (intQty > imgi2.Qty) {
                            var outDoneQty = intQty - imgi2.Qty;
                            PopupService.Alert(popup, 'outdone: ' + outDoneQty + ' Qty').then();
                        } else {
                            SqlService.Select('Imgi3_Picking', '*', "PackingNo='" + $scope.Detail.Scan.PackingNo + "' And LineItemNo='" + imgi2.LineItemNo + "'").then(function (results) {
                                var len = results.rows.length;
                                var intQty = 0;

                                if (len > 0) {
                                    if ($scope.Detail.Scan.PackingNo === results.rows.item(0).PackingNo) {
                                        //     intQty = $scope.Detail.Scan.Qty + results.rows.item(0).Qty;
                                        //
                                        // var obj = {
                                        //     Qty: intQty,
                                        // };
                                        // var strFilter = "LineItemNo='" + imgi2.LineItemNo + "' And PackingNo='" + $scope.Detail.Scan.PackingNo + "'";
                                        // SqlService.Update('Imgi3_Picking', obj, strFilter).then(function (res) {
                                        //     getImgi3(imgi2.LineItemNo);
                                        // });
                                        PopupService.Alert(popup, 'There Have Been A PackingNo ').then();
                                    }
                                } else {
                                    InsetImgi3(imgi2, RowNumber);
                                    // var objImgi3 = {
                                    //     PackingNo: $scope.Detail.Scan.PackingNo,
                                    //     LineItemNo: imgi2.LineItemNo,
                                    //     Qty: $scope.Detail.Scan.Qty,
                                    //     ProductCode: imgi2.ProductCode,
                                    //     ProductTrxNo: imgi2.ProductTrxNo,
                                    //     TrxNo: imgi2.TrxNo,
                                    //     // UomCode: imgi2.UomCode,   //
                                    //     ProductDescription: imgi2.ProductDescription,
                                    //     DimensionFlag: $scope.Detail.Imgi2s[0].DimensionFlag,
                                    //     RowNumber: RowNumber
                                    // };
                                    // SqlService.Insert('Imgi3_Picking', objImgi3).then(
                                    //     getImgi3(objImgi3.LineItemNo)
                                    // );
                                }
                            });
                        }
                    } else {
                        InsetImgi3(imgi2, 0);
                        // var objImgi3 = {
                        //     PackingNo: $scope.Detail.Scan.PackingNo,
                        //     LineItemNo: imgi2.LineItemNo,
                        //     Qty: $scope.Detail.Scan.Qty,
                        //     ProductCode: imgi2.ProductCode,
                        //     ProductTrxNo: imgi2.ProductTrxNo,
                        //     TrxNo: imgi2.TrxNo,
                        //     // UomCode: imgi2.UomCode,   //
                        //     ProductDescription: imgi2.ProductDescription,
                        //     DimensionFlag: $scope.Detail.Imgi2s[0].DimensionFlag,
                        //     RowNumber: 0
                        // };
                        // SqlService.Insert('Imgi3_Picking', objImgi3).then(
                        //     getImgi3(objImgi3.LineItemNo)
                        // );
                    }
                });
            } else {
                PopupService.Alert(popup, 'Please Enter PackingNo And Qty').then();
            }
        };

        var InsetImgi3 = function (imgi2, number) {
            var objImgi3 = {
                PackingNo: $scope.Detail.Scan.PackingNo,
                LineItemNo: imgi2.LineItemNo,
                Qty: $scope.Detail.Scan.Qty,
                ProductCode: imgi2.ProductCode,
                ProductTrxNo: imgi2.ProductTrxNo,
                TrxNo: imgi2.TrxNo,
                // UomCode: imgi2.UomCode,   //
                ProductDescription: imgi2.ProductDescription,
                DimensionFlag: $scope.Detail.Imgi2s[0].DimensionFlag,
                RowNumber: number
            };
            SqlService.Insert('Imgi3_Picking', objImgi3).then(
                getImgi3(objImgi3.LineItemNo)
            );
        };
        var getImgi3 = function (LineItemNo) {
            SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + LineItemNo).then(function (results) {
                var len = results.rows.length;
                var arrImgi3 = new Array();
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        var objImgi3 = results.rows.item(i);
                        arrImgi3.push(objImgi3);
                    }
                    $scope.Detail.imgi3 = arrImgi3;
                    $scope.modalImgi3.show();
                }
            });
        };
        var sumQty = function (Imgi2, CheckImgi3) {

            SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + Imgi2.LineItemNo).then(function (results) {
                var len = results.rows.length;
                var intQty = 0;
                var DetailPackingNoList = '';
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        DetailPackingNoList = DetailPackingNoList + ',' + results.rows.item(i).PackingNo;
                        var obj = {
                            Qty: $scope.Detail.imgi3[i].Qty,
                            PackingNo: $scope.Detail.imgi3[i].PackingNo,

                        };
                        var strFilter = 'TrxNo=' + Imgi2.TrxNo + ' And LineItemNo=' + Imgi2.LineItemNo + ' And RowNumber=' + i;
                        SqlService.Update('Imgi3_Picking', obj, strFilter).then(function (res) {

                        });
                        intQty = intQty + obj.Qty;
                    }
                    $scope.Detail.DetailPackingNoList = DetailPackingNoList.substr(1);
                    $scope.Detail.Scan.Qty = intQty;
                    //  $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].PackingNo='';
                    $scope.Detail.Scan.PackingNo = '';
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].PackingNo = '';
                    $scope.Detail.Imgi2.QtyBal = Imgi2.Qty - intQty;
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].ScanQty = intQty;
                    if (CheckImgi3 === 'Imgi3') {
                        var obj = {
                            ScanQty: intQty,
                        };
                        var strFilter = 'TrxNo=' + Imgi2.TrxNo + ' And LineItemNo=' + Imgi2.LineItemNo;
                        SqlService.Update('Imgi2_Picking', obj, strFilter).then(function (res) {

                        });
                    }
                }
            });
        };

        $scope.closeModalImgi3 = function (Imgi2) {
            $scope.modalImgi3.hide();
            sumQty(Imgi2, 'Imgi3');
        };
        var blnVerifyInput = function (type) {
            var blnPass = true;
            if (is.equal(type, 'StoreNo') && is.not.equal($scope.Detail.Scan.StoreNo, $scope.Detail.Imgi2.StoreNo)) {
                blnPass = false;
                PopupService.Alert(popup, 'Invalid Store No').then();
            } else if (is.equal(type, 'BarCode') && is.not.equal($scope.Detail.Scan.BarCode, $scope.Detail.Imgi2.BarCode)) {
                blnPass = false;
                PopupService.Alert(popup, 'Invalid Product Picked').then();
            } else if (is.equal(type, 'SerialNo') && is.not.equal($scope.Detail.Scan.SerialNo, $scope.Detail.Imgi2.SerialNo)) {
                blnPass = false;
                PopupService.Alert(popup, 'Invalid Product Picked').then();
            }
            return blnPass;
        };
        var setScanQty = function (barcode, imgi2) {
            if (is.equal(imgi2.SerialNoFlag, 'Y')) {
                $scope.Detail.Scan.Qty = imgi2.ScanQty;
                //$( '#txt-sn' ).removeAttr( 'readonly' );
                $('#txt-sn').select();
            } else {
                SqlService.Select('Imgi2_Picking', '*', 'TrxNo=' + imgi2.TrxNo + ' And LineItemNo=' + imgi2.LineItemNo).then(function (results) {
                    if (results.rows.length === 1) {
                        imgi2.ScanQty = (results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0);
                    }
                    imgi2.ScanQty += 1;
                    hmImgi2.remove(barcode);
                    hmImgi2.set(barcode, imgi2);
                    var obj = {
                        ScanQty: imgi2.ScanQty,
                        PackingNo: $scope.Detail.Scan.PackingNo
                    };
                    var strFilter = 'TrxNo=' + imgi2.TrxNo + ' And LineItemNo=' + imgi2.LineItemNo;
                    SqlService.Update('Imgi2_Picking', obj, strFilter).then(function (res) {
                        $scope.Detail.Scan.Qty = imgi2.ScanQty;
                        $scope.Detail.Scan.BarCode = '';
                        //yicong 170124
                        $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].ScanQty = imgi2.ScanQty;
                        $scope.Detail.Imgi2.ScanQty = imgi2.ScanQty;
                        //end
                        $scope.Detail.Imgi2.QtyBal = imgi2.Qty - imgi2.ScanQty;
                        if (is.equal(imgi2.Qty, imgi2.ScanQty)) {
                            $scope.showNext();
                        }
                    });
                });
            }
        };
        var showImpr = function (barcode, blnScan) {
            if (is.not.undefined(barcode) && is.not.null(barcode) && is.not.empty(barcode)) {
                if (hmImgi2.has(barcode)) {
                    // var imgi2 = hmImgi2.get(barcode);
                    // setScanQty(barcode, imgi2);
                    hmImgi2.remove(barcode);
                    hmImgi2.set(barcode, $scope.Detail.Imgi2);
                    setScanQty(barcode, $scope.Detail.Imgi2);
                } else {
                    showPopup('Invalid Product Picked', 'assertive');
                }
            }
        };

        var setSnQty = function (barcode, imgi2) {
            SqlService.Select('Imgi2_Picking', '*', 'TrxNo=' + imgi2.TrxNo + ' And LineItemNo=' + imgi2.LineItemNo).then(function (results) {
                if (results.rows.length === 1) {
                    imgi2.ScanQty = (results.rows.item(0).ScanQty > 0 ? results.rows.item(0).ScanQty : 0);
                }
                imgi2.ScanQty += 1;
                hmImgi2.remove(barcode);
                hmImgi2.set(barcode, imgi2);
                var obj = {
                    ScanQty: imgi2.ScanQty,

                };
                var strFilter = 'TrxNo=' + imgi2.TrxNo + ' And LineItemNo=' + imgi2.LineItemNo;
                SqlService.Update('Imgi2_Picking', obj, strFilter).then(function (res) {
                    $scope.Detail.Scan.Qty = imgi2.ScanQty;
                    $scope.Detail.Scan.SerialNo = '';
                    //yicong 170124
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].ScanQty = imgi2.ScanQty;
                    $scope.Detail.Imgi2.ScanQty = imgi2.ScanQty;
                    //end
                    if (is.equal(imgi2.Qty, imgi2.ScanQty)) {
                        $scope.showNext();
                    } else {
                        $scope.Detail.Imgi2.QtyBal = imgi2.Qty - imgi2.ScanQty;
                        $('#txt-sn').select();
                    }
                });
            });
        };
        var showSn = function (sn) {
            if (is.not.empty(sn)) {
                //yicong 170124
                hmImgi2.remove(barcode);
                // hmImgi2.set(barcode, $scope.Detail.Imgi2);
                //yicong 170124
                var barcode = $scope.Detail.Scan.BarCode,
                    SnArray = null,
                    imgi2 = hmImgi2.get(barcode);
                var imsn1 = {
                    ReceiptNoteNo: '',
                    ReceiptLineItemNo: '',
                    IssueNoteNo: $scope.Detail.GIN,
                    IssueLineItemNo: imgi2.LineItemNo,
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
                        // $scope.$apply();
                        return;
                    }
                } else {
                    SnArray = new Array();
                    SnArray.push(sn);
                    hmImsn1.set(barcode, SnArray);
                }
                //db_add_Imsn1_Picking(imsn1);
                setSnQty(barcode, imgi2);
            }
        };

        var showImgi2 = function (row) {
            if (row !== null && $scope.Detail.Imgi2s.length >= row) {
                $scope.Detail.Imgi2 = {
                    RowNum: $scope.Detail.Imgi2s[row].RowNum,
                    TrxNo: $scope.Detail.Imgi2s[row].TrxNo,
                    LineItemNo: $scope.Detail.Imgi2s[row].LineItemNo,
                    StoreNo: $scope.Detail.Imgi2s[row].StoreNo,
                    ProductTrxNo: $scope.Detail.Imgi2s[row].ProductTrxNo,
                    ProductCode: $scope.Detail.Imgi2s[row].ProductCode,
                    ProductDescription: $scope.Detail.Imgi2s[row].ProductDescription,
                    SerialNoFlag: $scope.Detail.Imgi2s[row].SerialNoFlag,
                    BarCode: $scope.Detail.Imgi2s[row].BarCode,
                    SerialNo: $scope.Detail.Imgi2s[row].SerialNo,
                    PackingNo: $scope.Detail.Imgi2s[row].PackingNo,
                    Qty: $scope.Detail.Imgi2s[row].Qty,
                    QtyBal: $scope.Detail.Imgi2s[row].Qty - $scope.Detail.Imgi2s[row].ScanQty
                };
                sumDetailQty($scope.Detail.Imgi2s[row]);

            }
            if (is.equal(row, $scope.Detail.Imgi2s.length - 1)) {
                $scope.Detail.blnNext = false;
            } else {
                $scope.Detail.blnNext = true;
            }
        };
        var sumDetailQty = function (Imgi2) {
            SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + Imgi2.LineItemNo).then(function (results) {
                var len = results.rows.length;
                var intQty = 0;
                var DetailPackingNoList = "";
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        intQty = intQty + results.rows.item(i).Qty;
                        DetailPackingNoList = DetailPackingNoList + ',' + results.rows.item(i).PackingNo;
                    }
                    $scope.Detail.Scan.Qty = intQty;
                    $scope.Detail.DetailPackingNoList = DetailPackingNoList.substr(1);
                    //  $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].PackingNo='';
                    $scope.Detail.Scan.PackingNo = '';
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].PackingNo = '';
                    $scope.Detail.Imgi2.QtyBal = Imgi2.Qty - intQty;
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].ScanQty = intQty;
                } else {
                    $scope.Detail.DetailPackingNoList = Imgi2.PackingNo;
                    $scope.Detail.Scan.Qty = Imgi2.ScanQty;
                    $scope.Detail.Scan.PackingNo = Imgi2.PackingNo;
                }
            });
        };
        var GetImgi2s = function (GoodsIssueNoteNo) {
            var objUri = ApiService.Uri(true, '/api/wms/imgi2/picking');
            objUri.addSearch('GoodsIssueNoteNo', GoodsIssueNoteNo);
            ApiService.Get(objUri, true).then(function success(result) {
                $scope.Detail.Imgi2s = result.data.results;
                SqlService.Delete('Imgi2_Picking').then(function () {
                    SqlService.Delete('Imgi3_Picking').then(function () {});
                    if (is.array($scope.Detail.Imgi2s) && is.not.empty($scope.Detail.Imgi2s)) {
                        for (var i in $scope.Detail.Imgi2s) {
                            var imgi2 = $scope.Detail.Imgi2s[i];
                            hmImgi2.set(imgi2.BarCode, imgi2);
                            hmImgi2.set(imgi2.BarCode2, imgi2);
                            hmImgi2.set(imgi2.BarCode3, imgi2);
                            SqlService.Insert('Imgi2_Picking', imgi2).then();
                        }
                        showImgi2(0);
                    } else {
                        PopupService.Info(popup, 'This GIN has no Products').then(function (res) {
                            $scope.returnList();
                        });
                    }
                });
            });
        };
        //var GetImsn1SerialNo = function(GoodsIssueNoteNo) {
        //    var strUri = '/api/wms/imsn1?GoodsIssueNoteNo=' + GoodsIssueNoteNo;
        //    ApiService.Get(strUri, true).then(function success(result) {
        //        $scope.Detail.Imsn1s = result.data.results;
        //        db_del_Imsn1_Picking();
        //        if (is.array($scope.Detail.Imsn1s) && is.not.empty($scope.Detail.Imsn1s)) {
        //            for (var i = 0; i < $scope.Detail.Imsn1s.length; i++) {
        //                hmImsn1.set($scope.Detail.Imsn1s[i].IssueNoteNo + "#" + $scope.Detail.Imsn1s[i].IssueLineItemNo, Imsn1.SerialNo);
        //                db_add_Imsn1_Picking($scope.Detail.Imsn1s[i]);
        //            }
        //        }
        //    });
        //};
        //GetImsn1SerialNo($scope.Detail.GIN);
        $scope.openModal = function () {
            $scope.modal.show();
            $ionicLoading.show();
            SqlService.Select('Imgi2_Picking', '*').then(function (results) {
                var len = results.rows.length;
                var arr = new Array();
                for (var i = 0; i < len; i++) {
                    var imgi2 = results.rows.item(i);
                    imgi2.Qty = results.rows.item(i).Qty > 0 ? results.rows.item(i).Qty : 0;
                    imgi2.ScanQty = results.rows.item(i).ScanQty > 0 ? results.rows.item(i).ScanQty : 0;
                    imgi2.QtyBal = results.rows.item(i).QtyBal > 0 ? results.rows.item(i).QtyBal : 0;
                    imgi2.PackingNo = results.rows.item(i).PackingNo;
                    arr.push(imgi2);
                }
                $scope.Detail.Imgi2sDb = arr;
                $ionicLoading.hide();
            }, function (res) {
                $ionicLoading.hide();
            });
        };
        $scope.StatusAll = ["", "Damaged", "Shortlanded"];
        $scope.updateQtyStatus = function () {
            var len = $scope.Detail.Imgi2sDb.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    var Imgi2_PickingFilter = "TrxNo='" + $scope.Detail.Imgi2sDb[i].TrxNo + "' and  LineItemNo='" + $scope.Detail.Imgi2sDb[i].LineItemNo + "' "; // not record
                    var objImgi2_Picking = {
                        QtyStatus: $scope.Detail.Imgi2sDb[i].QtyStatus
                    };
                    SqlService.Update('Imgi2_Picking', objImgi2_Picking, Imgi2_PickingFilter).then(function (res) {});
                }
            }
        };

        $scope.closeModal = function () {
            $scope.updateQtyStatus();
            $scope.Detail.Imgi2sDbImgi2sDb = {};
            $scope.modal.hide();
        };
        $scope.returnList = function () {
            $state.go('pickingList', {}, {
                reload: true
            });
        };
        $scope.checkQty = function () {
            if ($scope.Detail.Scan.Qty < 0) {
                $scope.Detail.Scan.Qty = 0;
            } else {
                // if ($scope.Detail.Imgi2.Qty - $scope.Detail.Scan.Qty < 0) {
                //     $scope.Detail.Scan.Qty = $scope.Detail.Imgi2.Qty;
                // }else{
                //
                // }

                // if ($scope.Detail.Imgi2.Qty - $scope.Detail.Scan.Qty > 0) {
                //     PopupService.Alert(popup, 'Qty Is less than BalanceQty').then(function (res) {});
                // } else {
                //     PopupService.Alert(popup, 'Qty Is More than,It Will Update Qty=BalnaceQty=' + $scope.Detail.Imgi2.Qty).then(function (res) {});
                // }

            }
        };

        $scope.changeImgi3Qty = function (Imgi3, intI) {
            SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + Imgi3.LineItemNo).then(function (results) {
                var len = results.rows.length;
                var intQty = 0;
                var intDifferQty = 0;
                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        if (i === Imgi3.RowNumber) {} else {
                            intQty = intQty + results.rows.item(i).Qty;
                        }
                    }
                    intDifferQty = $scope.Detail.Imgi2.Qty - intQty;
                    $scope.Detail.imgi3.Qty = $scope.Detail.imgi3[Imgi3.RowNumber].Qty;
                    var promptPopup = $ionicPopup.show({
                        template: '<input type="number" ng-model="Detail.imgi3.Qty" ng-change="checkQty();">',
                        title: 'Enter Qty',
                        subTitle: 'Are you sure to change Qty manually?',
                        scope: $scope,
                        buttons: [{
                            text: 'Cancel'
                        }, {
                            text: '<b>Save</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                if ((intDifferQty - $scope.Detail.imgi3.Qty) >= 0) {
                                    $scope.Detail.imgi3[Imgi3.RowNumber].Qty = $scope.Detail.imgi3.Qty;
                                    var obj = {
                                        Qty: $scope.Detail.imgi3[Imgi3.RowNumber].Qty

                                    };
                                    var strFilter = 'TrxNo=' + Imgi3.TrxNo + ' And LineItemNo=' + Imgi3.LineItemNo + ' And RowNumber=' + Imgi3.RowNumber;
                                    SqlService.Update('Imgi3_Picking', obj, strFilter).then(function (res) {

                                    });
                                } else {
                                    var intMoreQty = $scope.Detail.imgi3.Qty - intDifferQty;
                                    PopupService.Alert(popup, 'Qty Is More than ' + intMoreQty + ' Do Not Modify').then(function (res) {});
                                }
                            }
                        }]
                    });

                }
            });
        };
        $scope.changeQty = function () {
            if (is.not.empty($scope.Detail.Imgi2.BarCode) && hmImgi2.count() > 0) {
                // var imgi2 = hmImgi2.get($scope.Detail.Imgi2.BarCode);
                // yicong 170114
                hmImgi2.remove($scope.Detail.Imgi2.BarCode);
                hmImgi2.set($scope.Detail.Imgi2.BarCode, $scope.Detail.Imgi2);
                var imgi2 = $scope.Detail.Imgi2;
                //  end
                var promptPopup = $ionicPopup.show({
                    template: '<input type="number" ng-model="Detail.Scan.Qty" ng-change="checkQty();">',
                    title: 'Enter Qty',
                    subTitle: 'Are you sure to change Qty manually?',
                    scope: $scope,
                    buttons: [{
                        text: 'Cancel'
                    }, {
                        text: '<b>Save</b>',
                        type: 'button-positive',
                        onTap: function (e) {

                            SqlService.Select('Imgi3_Picking', '*', 'LineItemNo=' + $scope.Detail.Imgi2.LineItemNo).then(function (results) {
                                var len = results.rows.length;
                                var intQty = 0;
                                if (len > 0) {
                                    for (var i = 0; i < len; i++) {
                                        intQty = intQty + results.rows.item(i).Qty;
                                    }

                                    imgi2.ScanQty = intQty + $scope.Detail.Scan.Qty;
                                    if ($scope.Detail.Imgi2.Qty - imgi2.ScanQty < 0) {
                                        var Qty = $scope.Detail.Scan.Qty - (imgi2.ScanQty - $scope.Detail.Imgi2.Qty);
                                        PopupService.Alert(popup, 'Qty Is More than,It Will Update Qty=BalnaceQty=' + Qty).then(function (res) {

                                        });

                                        imgi2.ScanQty = Qty+intQty;
                                    } else if ($scope.Detail.Imgi2.Qty === imgi2.ScanQty) {
                                        imgi2.ScanQty = $scope.Detail.Scan.Qty;
                                    } else {
                                        PopupService.Alert(popup, 'Qty Is less than BalanceQty').then(function (res) {});
                                        imgi2.ScanQty = $scope.Detail.Scan.Qty+intQty;
                                    }
                                    // imgi2.ScanQty = $scope.Detail.Scan.Qty;
                                    // // yicong 170114
                                    // $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].ScanQty = imgi2.ScanQty;
                                    // $scope.Detail.Imgi2.ScanQty = imgi2.ScanQty;
                                    // //  end
                                    $scope.Detail.Scan.Qty = $scope.Detail.Scan.Qty;
                                    $scope.Detail.Imgi2.QtyBal = imgi2.Qty - imgi2.ScanQty;

                                    //
                                } else {

                                    if ($scope.Detail.Imgi2.Qty - $scope.Detail.Scan.Qty < 0) {
                                        PopupService.Alert(popup, 'Qty Is More than,It Will Update Qty=BalnaceQty=' + $scope.Detail.Imgi2.Qty).then(function (res) {

                                        });

                                        $scope.Detail.Scan.Qty = $scope.Detail.Imgi2.Qty;
                                    } else if ($scope.Detail.Imgi2.Qty === $scope.Detail.Scan.Qty) {} else {
                                        PopupService.Alert(popup, 'Qty Is less than BalanceQty').then(function (res) {});
                                    }
                                    imgi2.ScanQty = $scope.Detail.Scan.Qty;
                                    // yicong 170114
                                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].ScanQty = imgi2.ScanQty;
                                    $scope.Detail.Imgi2.ScanQty = imgi2.ScanQty;
                                    //  end
                                    $scope.Detail.Imgi2.QtyBal = imgi2.Qty - imgi2.ScanQty;
                                    var obj = {
                                        ScanQty: imgi2.ScanQty
                                    };
                                    var strFilter = 'TrxNo=' + imgi2.TrxNo + ' And LineItemNo=' + imgi2.LineItemNo;
                                    SqlService.Update('Imgi2_Picking', obj, strFilter).then(function (res) {

                                        // if ($scope.Detail.Imgi2.Qty - $scope.Detail.Scan.Qty > 0) {
                                        //     PopupService.Alert(popup, 'Qty Is less than BalanceQty').then(function (res) {});
                                        // } else {
                                        //     PopupService.Alert(popup, 'Qty Is More than,It Will Update Qty=BalnaceQty=' + $scope.Detail.Imgi2.Qty).then(function (res) {});
                                        // }
                                    });
                                }
                            });
                        }
                    }]
                });
            }
        };
        $scope.openCam = function (type) {
            if (!ENV.fromWeb) {
                if (is.equal(type, 'StoreNo')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {

                        $scope.Detail.Scan.StoreNo = imageData.text;
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'PackingNo')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        // $scope.PackingNo = imageData.text;
                        // $scope.Detail.Scan.PackingNo = $scope.Detail.Scan.PackingNo === '' ? imageData.text : 　$scope.Detail.Scan.PackingNo;
                        $scope.Detail.Scan.PackingNo = imageData.text;
                        updatePackingNo($scope.Detail.Scan.PackingNo);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'BarCode')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.Detail.Scan.BarCode = imageData.text;
                        if (blnVerifyInput('BarCode')) {
                            showImpr($scope.Detail.Scan.BarCode, true);
                        }

                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'SerialNo')) {
                    //if ($('#txt-sn').attr("readonly") != "readonly") {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.Detail.Scan.SerialNo = imageData.text;
                        showSn($scope.Detail.Scan.SerialNo, false);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                    //}
                }
            }
        };
        $scope.clearInput = function (type) {
            if (is.equal(type, 'BarCode')) {
                if ($scope.Detail.Scan.BarCode.length > 0) {
                    $scope.Detail.Scan.BarCode = '';
                    $scope.Detail.Scan.SerialNo = '';
                    $scope.Detail.Scan.Qty = 0;
                    //$('#txt-sn').attr('readonly', true);
                    $('#txt-barcode').select();
                }
            } else if (is.equal(type, 'SerialNo')) {
                if ($scope.Detail.Scan.SerialNo.length > 0) {
                    $scope.Detail.Scan.SerialNo = "";
                    $('#txt-sn').select();
                }
            } else if (is.equal(type, 'StoreNo')) {
                if ($scope.Detail.Scan.StoreNo.length > 0) {
                    $scope.Detail.Scan.StoreNo = '';
                    $('#txt-storeno').select();
                }
            } else if (is.equal(type, 'PackingNo')) {
                if ($scope.Detail.Scan.PackingNo.length > 0) {
                    $scope.Detail.Scan.PackingNo = '';
                    $('#txt-packingno').select();
                }
            } else {
                $scope.Detail.Scan.StoreNo = '';
                $scope.Detail.Scan.BarCode = '';
                $scope.Detail.Scan.SerialNo = '';
                $scope.Detail.Scan.Qty = 0;
                // $scope.Detail.Scan.PackingNo = $scope.PackingNo;

                //$('#txt-sn').attr('readonly', true);
                $('#txt-storeno').select();
            }
        };
        $scope.showPrev = function () {
            var intRow = $scope.Detail.Imgi2.RowNum - 1;
            if ($scope.Detail.Imgi2s.length > 0 && intRow > 0 && is.equal($scope.Detail.Imgi2s[intRow - 1].RowNum, intRow)) {
                $scope.clearInput();
                showImgi2(intRow - 1);
            } else {
                PopupService.Info(popup, 'Already the first one');
            }
        };
        $scope.showNext = function () {
            var intRow = $scope.Detail.Imgi2.RowNum + 1;
            if ($scope.Detail.Imgi2s.length > 0 && $scope.Detail.Imgi2s.length >= intRow && is.equal($scope.Detail.Imgi2s[intRow - 1].RowNum, intRow)) {
                $scope.clearInput();
                showImgi2(intRow - 1);
            } else {
                PopupService.Info(popup, 'Already the last one');
            }
        };

        $scope.checkConfirm = function () {
            // confirmIfmgi3();
            $ionicLoading.show();
            SqlService.Select('Imgi2_Picking', '*').then(function (results) {
                var len = results.rows.length;
                if (len > 0) {
                    var imgi2;
                    var blnDiscrepancies = false;
                    for (var i = 0; i < len; i++) {
                        imgi2 = results.rows.item(i);
                        if (is.not.empty(imgi2.BarCode)) {
                            if (imgi2.Qty != imgi2.ScanQty) {
                                if (imgi2.Qty > imgi2.ScanQty && imgi2.QtyStatus != null && (imgi2.QtyStatus === 'Damaged' || imgi2.QtyStatus === 'Shortlanded')) {
                                    switch (imgi2.DimensionFlag) {
                                    case '1':
                                        $scope.Detail.QtyName = 'PackingQty';
                                        break;
                                    case '2':
                                        $scope.Detail.QtyName = 'WholeQty';
                                        break;
                                    default:
                                        $scope.Detail.QtyName = 'LooseQty';
                                    }
                                    var objUri = ApiService.Uri(true, '/api/wms/imgi2/qtyremark');
                                    objUri.addSearch('LineItemNo', imgi2.LineItemNo);
                                    objUri.addSearch('TrxNo', imgi2.TrxNo);
                                    objUri.addSearch('ReceiptMovementTrxNo', imgi2.ReceiptMovementTrxNo);
                                    objUri.addSearch('QtyRemarkQty', imgi2.ScanQty);
                                    objUri.addSearch('QtyRemarkBackQty', (imgi2.Qty - imgi2.ScanQty));
                                    objUri.addSearch('QtyFieldName', $scope.Detail.QtyName);
                                    objUri.addSearch('PackingNo', '');
                                    objUri.addSearch('UserId', sessionStorage.getItem('UserId').toString());
                                    objUri.addSearch('QtyRemark', imgi2.QtyStatus + ' LN:' + imgi2.LineItemNo + ' ' + imgi2.ProductCode + ' ' + imgi2.Qty + '>' + imgi2.ScanQty);
                                    ApiService.Get(objUri, true).then(function success(result) {});
                                } else {
                                    console.log('Product (' + imgi2.ProductCode + ') Qty not equal.');
                                    blnDiscrepancies = true;
                                }
                            } else if (imgi2.PackingNo !== null && imgi2.PackingNo !== '') {
                                var objUri = ApiService.Uri(true, '/api/wms/imgi2/packingno');
                                objUri.addSearch('LineItemNo', imgi2.LineItemNo);
                                objUri.addSearch('TrxNo', imgi2.TrxNo);
                                objUri.addSearch('UserId', sessionStorage.getItem('UserId').toString());
                                objUri.addSearch('PackingNo', '');
                                ApiService.Get(objUri, true).then(function success(result) {});
                            }
                        } else {
                            blnDiscrepancies = true;
                        }
                    }
                    $ionicLoading.hide();
                    if (blnDiscrepancies) {
                        PopupService.Alert(popup, 'Discrepancies on Qty').then(function (res) {
                            $scope.openModal();
                        });
                    } else {
                        var objUri = ApiService.Uri(true, '/api/wms/imgi1/update');
                        objUri.addSearch('TrxNo', imgi2.TrxNo);
                        objUri.addSearch('UserID', sessionStorage.getItem('UserId').toString());
                        objUri.addSearch('StatusCode', 'CMP');
                        ApiService.Get(objUri, true).then(function (res) {
                            confirmImgi3();
                            return PopupService.Info(popup, 'Confirm Success');
                        }).then(function (res) {
                            $scope.returnList();
                        });
                    }
                } else {
                    $ionicLoading.hide();
                    PopupService.Alert(popup, 'Discrepancies on Qty').then(function (res) {
                        $scope.openModal();
                    });
                }
            });
        };
        // $scope.PackingNo;
        var updatePackingNo = function (PackingNo) {
            SqlService.Select('Imgi3_Picking', '*', "PackingNo='" + PackingNo + "' And LineItemNo='" + $scope.Detail.Imgi2.LineItemNo + "'").then(function (results) {
                if (results.rows.length > 0) {
                    var imgi3 = results.rows.item(0);
                    $scope.Detail.Scan.Qty = imgi3.Qty;
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].PackingNo = imgi3.PackingNo;
                } else {
                    $scope.Detail.Scan.Qty = 0;
                    $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].PackingNo = PackingNo;
                    var obj = {
                        PackingNo: PackingNo
                    };
                    var strFilter = 'TrxNo=' + $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].TrxNo + ' And LineItemNo=' + $scope.Detail.Imgi2s[$scope.Detail.Imgi2.RowNum - 1].LineItemNo;
                    SqlService.Update('Imgi2_Picking', obj, strFilter).then();
                }
            });

        };
        $scope.enter = function (ev, type) {
            if (is.equal(ev.keyCode, 13)) {
                if (is.equal(type, 'barcode') && is.not.empty($scope.Detail.Scan.BarCode)) {
                    if (blnVerifyInput('BarCode')) {
                        showImpr($scope.Detail.Scan.BarCode);
                    }
                } else if (is.equal(type, 'serialno') && is.not.empty($scope.Detail.Imgi2.StoreNo)) {
                    if (blnVerifyInput('SerialNo')) {
                        showSn($scope.Detail.SerialNo);
                    }
                } else if (is.equal(type, 'storeno') && is.not.empty($scope.Detail.Scan.StoreNo)) {
                    if (blnVerifyInput('StoreNo')) {
                        $('#txt-barcode').focus();
                    }
                } else if (is.equal(type, 'PackingNo') && is.not.empty($scope.Detail.Scan.PackingNo)) {
                    updatePackingNo($scope.Detail.Scan.PackingNo);
                    $('#txt-storeno').focus();
                }

                if (!ENV.fromWeb) {
                    $cordovaKeyboard.close();
                }
            }
        };
        $ionicPlatform.ready(function () {
            GetImgi2s($scope.Detail.GIN);
        });

        $scope.GoToCartonDetail = function (Imgi2, Detail) {
            if (Imgi2 !== null) {
                $state.go('CartonDetail', {
                    'LineItemNo': Imgi2.LineItemNo,
                    'CustomerCode': Detail.Customer,
                    'TrxNo': Imgi2.TrxNo,
                    'GoodsIssueNoteNo': Detail.GIN
                }, {
                    reload: true
                });
            }
        };

        var confirmImgi3 = function () {
            SqlService.Select('Imgi3_Picking', '*').then(function (results) {
                var len = results.rows.length;
                var LineItemNoList = "";
                var QtyList = "";
                var PackingNoList = "";
                var ProductDescriptionList = "";
                var ProductTrxNoList = "";
                var ProductCodeList = "";
                var TrxNo = "";
                var DimensionFlag = "";
                if (len > 0) {
                    for (var i = 0; i < len; i++) {

                        var objImgi3 = results.rows.item(i);
                        hmImgi3.set(objImgi3.LineItemNo, objImgi3.LineItemNo);
                        TrxNo = objImgi3.TrxNo;
                        LineItemNoList = LineItemNoList + ',' + objImgi3.LineItemNo;
                        QtyList = QtyList + ',' + objImgi3.Qty;
                        PackingNoList = PackingNoList + ',' + objImgi3.PackingNo;
                        ProductDescriptionList = ProductDescriptionList + ',' + objImgi3.ProductDescription;
                        ProductTrxNoList = ProductTrxNoList + ',' + objImgi3.ProductTrxNo;
                        ProductCodeList = ProductCodeList + ',' + objImgi3.ProductCode;
                        DimensionFlag = objImgi3.DimensionFlag;
                    }
                    SqlService.Select('Imgi2_Picking', '*').then(function (results) {
                        var len = results.rows.length;
                        if (len > 0) {
                            for (var i = 0; i < len; i++) {
                                var objImgi2 = results.rows.item(i);
                                if (!hmImgi3.has(objImgi2.LineItemNo)) {
                                    TrxNo = objImgi2.TrxNo;
                                    if (objImgi2.PackingNo === null) {
                                        objImgi2.PackingNo = '';
                                    }
                                    LineItemNoList = LineItemNoList + ',' + objImgi2.LineItemNo;
                                    QtyList = QtyList + ',' + objImgi2.ScanQty;
                                    PackingNoList = PackingNoList + ',' + objImgi2.PackingNo;
                                    ProductDescriptionList = ProductDescriptionList + ',' + objImgi2.ProductDescription;
                                    ProductTrxNoList = ProductTrxNoList + ',' + objImgi2.ProductTrxNo;
                                    ProductCodeList = ProductCodeList + ',' + objImgi2.ProductCode;
                                    DimensionFlag = objImgi2.DimensionFlag;

                                }
                            }
                            var objUriUpdate = ApiService.Uri(true, '/api/wms/imgi3/picking/confim');
                            objUriUpdate.addSearch('LineItemNoList', LineItemNoList);
                            objUriUpdate.addSearch('QtyList', QtyList);
                            objUriUpdate.addSearch('PackingNoList', PackingNoList);
                            objUriUpdate.addSearch('TrxNo', TrxNo);
                            objUriUpdate.addSearch('ProductDescriptionList', ProductDescriptionList);
                            objUriUpdate.addSearch('ProductTrxNoList', ProductTrxNoList);
                            objUriUpdate.addSearch('ProductCodeList', ProductCodeList);
                            objUriUpdate.addSearch('DimensionFlag', DimensionFlag);
                            ApiService.Get(objUriUpdate, false).then(function success(result) {});
                        }
                    });

                }
            });
        };
    }
]);

// appControllers.controller('CartonDetailCtrl', [
//     'ENV',
//     '$scope',
//     '$stateParams',
//     '$state',
//     '$cordovaKeyboard',
//     'ApiService',
//     function (
//         ENV,
//         $scope,
//         $stateParams,
//         $state,
//         $cordovaKeyboard,
//         ApiService) {
//           $scope.Detail = {
//               Customer: $stateParams.CustomerCode,
//               GIN: $stateParams.GoodsIssueNoteNo,
//               TrxNo:  $stateParams.TrxNo,
//               LineItemNo: $stateParams.LineItemNo
//             };
//         $scope.GoToDetail = function (Imgi1) {
//             if (Imgi1 !== null) {
//                 $state.go('pickingDetail', {
//                     'CustomerCode': Imgi1.Customer,
//                     'TrxNo': Imgi1.TrxNo,
//                     'GoodsIssueNoteNo': Imgi1.GIN
//                 }, {
//                     reload: true
//                 });
//             }
//         };
//     }
// ]);
