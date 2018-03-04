appControllers.controller('EnquiryListCtrl', [
    'ENV',
    '$scope',
    '$stateParams',
    '$state',
    '$cordovaKeyboard',
    '$cordovaBarcodeScanner',
    '$cordovaToast',
    'ApiService',
    'PopupService',
    function (
        ENV,
        $scope,
        $stateParams,
        $state,
        $cordovaKeyboard,
        $cordovaBarcodeScanner,
        $cordovaToast,
        ApiService,
        PopupService
    ) {
        var popup = null;
        $scope.Impr1 = {};
        $scope.Impm1 = {
            UserDefine1: '',
        };
        $scope.Whwh1 = {};
        $scope.Whwh2 = {
            StoreNo: '',
        };

        $scope.Impm1sEnquiry = {};
        $scope.defaultWhwh1 = function () {
            var objUri1 = ApiService.Uri(true, '/api/wms/whwh1');
            ApiService.Get(objUri1, false).then(function success(result) {
                $scope.Whwh1s = result.data.results;
                $scope.Whwh1.selected = $scope.Whwh1s[0];
            });
        };
        $scope.defaultWhwh1();
        $scope.refreshWhwh1 = function (WarehouseName) {
            if (is.not.undefined(WarehouseName) && is.not.empty(WarehouseName)) {
                var objUri1 = ApiService.Uri(true, '/api/wms/whwh1');
                objUri.addSearch('WarehouseName', WarehouseName);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Whwh1s = result.data.results;
                    $scope.Whwh1.selected = $scope.Whwh1s[0];
                });
            }
        };
        $scope.refreshImpr1 = function (ScanProductCode, ProductCode) {
            if (is.not.undefined(ProductCode) && is.not.empty(ProductCode)) {
                var objUri = ApiService.Uri(true, '/api/wms/impr1');
                objUri.addSearch('ProductCode', ProductCode);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Impr1s = result.data.results;
                    if (is.equal(ScanProductCode, 'ScanProductCode')) {
                        if ($scope.Impr1s !== null && $scope.Impr1s.length > 0) {
                            $scope.Impr1.selected = $scope.Impr1s[0];
                            $scope.showImpm($scope.Impr1.selected.ProductCode, null);
                        } else {
                            $scope.showImpm(null, null);
                        }
                    }
                });
            } else {
                $scope.showImpm(null, null);
            }
        };

        $scope.refreshWhwh1 = function (WarehouseName) {
            if (is.not.undefined(WarehouseName) && is.not.empty(WarehouseName)) {
                var objUri = ApiService.Uri(true, '/api/wms/whwh1');
                objUri.addSearch('WarehouseName', WarehouseName);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Whwh1s = result.data.results;
                    $scope.Whwh1.selected = $scope.Whwh1s[0];
                });
            }
        };
        $scope.refreshWhwh2 = function (ScanStoreNo, StoreNo) {
            if (is.not.empty($scope.Whwh1) && is.not.undefined(StoreNo) && is.not.empty(StoreNo)) {
                var objUri = ApiService.Uri(true, '/api/wms/whwh2');
                objUri.addSearch('WarehouseCode', $scope.Whwh1.selected.WarehouseCode);
                objUri.addSearch('StoreNo', StoreNo);
                objUri.addSearch('EnquiryFlag', 'Y');
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Whwh2s = result.data.results;

                    if ($scope.Whwh2s.length > 0) {
                        $scope.Whwh2.StoreNo = $scope.Whwh2s[0].StoreNo;
                        // $scope.Whwh2.selected = $scope.Whwh2s[0];
                        $scope.showImpmwh(null, $scope.Whwh2.StoreNo);
                    } else {
                        $scope.Whwh2.StoreNo = '';
                        $scope.showImpmwh(null, null);
                        PopupService.Alert(popup, 'Wrong StoreNo');

                    }

                    // if (is.equal(ScanStoreNo, 'ScanStoreNo')) {
                    //     if ( $scope.Whwh2s.length > 0) {
                    //         $scope.Whwh2.StoreNo = $scope.Whwh2s[0].StoreNo;
                    //         // $scope.Whwh2.selected = $scope.Whwh2s[0];
                    //         $scope.showImpmwh(null, $scope.Whwh2.StoreNo);
                    //     } else {
                    //         $scope.showImpmwh(null, null);
                    //         PopupService.Alert(popup, 'Wrong StoreNo');
                    //         $scope.Whwh2.StoreNo = '';
                    //     }
                    // } else {
                    //     if ($scope.Whwh2s.length > 0) {
                    //         $scope.Whwh2.StoreNo = $scope.Whwh2s[0].StoreNo;
                    //         $scope.showImpmwh(null, $scope.Whwh2.StoreNo);
                    //     } else {
                    //         $scope.showImpmwh(null, null);
                    //         PopupService.Alert(popup, 'Wrong StoreNo');
                    //         $scope.Whwh2.StoreNo = '';
                    //     }
                    // }
                });
            }
        };

        $scope.enter = function (ev, type) {
            if (is.equal(ev.keyCode, 13)) {
                if (is.null(popup)) {
                    if (is.equal(type, 'StoreNo')) {
                        $scope.refreshWhwh2('EnterStoreNo', $scope.Whwh2.StoreNo);
                        $('#txt-StoreNo').select();
                    } else if (is.equal(type, 'BarCode')) {
                        $scope.refreshImpm1s('EnterBarCode', $scope.Impm1.UserDefine1);
                        $('#iCustBatchNo').focus();
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
        $scope.clearInput = function (type) {
            if (is.equal(type, 'WarehouseName')) {
                $scope.Whwh1.selected = null;
                $scope.Whwh2.StoreNo = null;
                $scope.showImpm(null, null);
            } else if (is.equal(type, 'UserDefine1')) {
                $scope.Impm1.UserDefine1 = '';
                $scope.showImpm(null, null);
            } else if (is.equal(type, 'StoreNo')) {
                $scope.Whwh2.StoreNo = '';
                $scope.showImpm(null, null);
            } else if (is.equal(type, 'ProductCode')) {
                $scope.Impr1.selected = null;
                $scope.showImpm(null, null);
            }
        };
        $scope.refreshImpm1s = function (ScanUserDefine1, UserDefine1) {
            if (is.not.undefined(UserDefine1) && is.not.empty(UserDefine1)) {
                var objUri = ApiService.Uri(true, '/api/wms/impm1');
                objUri.addSearch('UserDefine1', UserDefine1);
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Impm1s = result.data.results;
                    if ($scope.Impm1s.length > 0) {
                        $scope.Impm1.UserDefine1 = $scope.Impm1s[0].UserDefine1;
                        $scope.Impm1.TrxNo = $scope.Impm1s[0].TrxNo;
                        $scope.showImpm(null, $scope.Impm1.UserDefine1);
                    } else {
                        $scope.Impm1.UserDefine1 = '';
                        $scope.showImpm(null, null);
                        PopupService.Alert(popup, 'Wrong BarCode');
                    }
                    // if (is.equal(ScanUserDefine1, 'ScanUserDefine1')) {
                    //     if ($scope.Impm1s !== null && $scope.Impm1s.length > 0) {
                    //         $scope.Impm1.selected = $scope.Impm1s[0];
                    //         $scope.showImpm(null, $scope.Impm1.selected);
                    //     } else {
                    //         $scope.showImpm(null, null);
                    //     }
                    // }
                });
            } else {
                $scope.showImpm(null, null);

            }
        };
        $scope.showDate = function (utc) {
            return moment(utc).format('DD-MMM-YYYY');
        };
        $scope.returnMain = function () {
            $state.go('index.main', {}, {
                reload: true
            });
        };
        $scope.showImpm = function (ProductCode, Impm1) {
            $scope.showImpmAll();
            // if (is.not.undefined(ProductCode) && is.not.null(ProductCode)) {
            //     var objUri = ApiService.Uri(true, '/api/wms/impm1/enquiry');
            //     objUri.addSearch('ProductCode', ProductCode);
            //     ApiService.Get(objUri, false).then(function success(result) {
            //         $scope.Impm1sEnquiry = result.data.results;
            //     });
            // } else if (is.not.undefined(Impm1) && is.not.null(Impm1)) {
            //     var objUri = ApiService.Uri(true, '/api/wms/impm1/enquiry');
            //     objUri.addSearch('TrxNo', Impm1.TrxNo);
            //     ApiService.Get(objUri, false).then(function success(result) {
            //         $scope.Impm1sEnquiry = result.data.results;
            //
            //     });
            // } else {
            //     $scope.Impm1sEnquiry = {};
            // }
            // if (!ENV.fromWeb) {
            //     $cordovaKeyboard.close();
            // }
        };
        $scope.showImpmwh = function (WarehouseCode, StoreNo) {
            $scope.showImpmAll();
            // if (is.not.undefined(StoreNo) && is.not.null(StoreNo)) {
            //     var objUri = ApiService.Uri(true, '/api/wms/impm1/enquiry');
            //     objUri.addSearch('WarehouseCode', $scope.Whwh1.selected.WarehouseCode);
            //     objUri.addSearch('StoreNo', StoreNo);
            //     ApiService.Get(objUri, false).then(function success(result) {
            //         $scope.Impm1sEnquiry = result.data.results;
            //     });
            // } else {
            //     $scope.Impm1sEnquiry = {};
            // }
            // if (!ENV.fromWeb) {
            //     $cordovaKeyboard.close();
            // }
        };
        $scope.showImpmAll = function () {
            if (is.not.empty($scope.Whwh2.StoreNo) || (is.not.undefined($scope.Impr1.selected) && is.not.null($scope.Impr1.selected)) || (is.not.empty($scope.Impm1.UserDefine1))) {
                var objUri = ApiService.Uri(true, '/api/wms/impm1/enquiry');
                if (is.not.undefined($scope.Whwh2.StoreNo) && is.not.null($scope.Whwh2.StoreNo)) {
                    objUri.addSearch('WarehouseCode', $scope.Whwh1.selected.WarehouseCode);
                    objUri.addSearch('StoreNo', $scope.Whwh2.StoreNo);
                }
                if (is.not.undefined($scope.Impr1.selected) && is.not.null($scope.Impr1.selected)) {
                    objUri.addSearch('ProductCode', $scope.Impr1.selected.ProductCode);
                }
                if (is.not.undefined($scope.Impm1.UserDefine1) && is.not.null($scope.Impm1.UserDefine1)) {
                    objUri.addSearch('ProductTrxNo', $scope.Impm1.TrxNo);
                }
                ApiService.Get(objUri, false).then(function success(result) {
                    $scope.Impm1sEnquiry = result.data.results;
                });
            } else {
                $scope.Impm1sEnquiry = {};
            }
        };
        $scope.openCam = function (type) {
            if (!ENV.fromWeb) {
                if (is.equal(type, 'ProductCode')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.refreshImpr1("ScanProductCode", imageData.text);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'UserDefine1')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.refreshImpm1s("ScanUserDefine1", imageData.text);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'WarehouseName')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.refreshWhwh1(imageData.text);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                } else if (is.equal(type, 'StoreNo')) {
                    $cordovaBarcodeScanner.scan().then(function (imageData) {
                        $scope.refreshWhwh2("ScanStoreNo", imageData.text);
                    }, function (error) {
                        $cordovaToast.showShortBottom(error);
                    });
                }
            }
        };
        $scope.Change = function (ChangeValue) {
            if (ChangeValue !== '') {
                Console.log(ChangeValue);
            } else {
                conosole.log('dd');
            }
        };
        $('#iProductCode').on('keydown', function (e) {
            if (e.which === 9 || e.which === 13) {
                $('#iCustBatchNo').focus();
            }
        });
    }
]);
