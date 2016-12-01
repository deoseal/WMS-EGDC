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
            NextStatus: '',
            Imcc2: {
                setColorPacking: '',
                setColorWhole: '',
                setColorLoose: ''
            },
            Impr1: {
                ProductCode: '',
                ProductDescription: ''
            },
            Imcc2s: {},
            Imcc2sDb: {}
        };

        $scope.returnList = function () {
            if ($ionicHistory.backView()) {
                $ionicHistory.goBack();
            } else {
                $state.go('cycleCountList', {}, {
                    reload: false
                });
            }
        };

        $scope.showPrev = function () {
            var intRow = $scope.Detail.Imcc2.RowNum - 1;
            if ($scope.Detail.Imcc2s.length > 0 && intRow > 0 && is.equal($scope.Detail.Imcc2s[intRow - 1].RowNum, intRow)) {
                // $scope.clearInput();
                showImcc2(intRow - 1);
            } else {
                PopupService.Info(popup, 'Already the first one');
            }
        };
        var checkDimensionQty = function (DimensionFlag) {
            if (DimensionFlag !== "") {
                if (DimensionFlag === '1') {
                    if ($scope.Detail.Imcc2.PackingQtyTempValue < 1) {
                        PopupService.Info(popup, 'Packing Qty Must Be Greater Than Zero ');
                        $scope.Detail.NextStatus = true;
                    } else {
                        $scope.Detail.NextStatus = false;
                    }
                } else if (DimensionFlag === '2') {
                    if ($scope.Detail.Imcc2.WholeQtyTempValue < 1) {
                        PopupService.Info(popup, 'Whole Qty Must Be Greater Than Zero ');
                        $scope.Detail.NextStatus = true;
                    } else {
                        $scope.Detail.NextStatus = false;
                    }
                } else if (DimensionFlag === '3') {
                    if ($scope.Detail.Imcc2.LooseQtyTempValue < 1) {
                        PopupService.Info(popup, 'Loose Qty Must Be Greater Than Zero ');
                        $scope.Detail.NextStatus = true;
                    } else {
                        $scope.Detail.NextStatus = false;
                    }
                } else {}
            }
        };
        $scope.showNext = function () {
            var DimensionFlag = $scope.Detail.Imcc2.DimensionFlag;
            var intRow = $scope.Detail.Imcc2.RowNum + 1;
            if ($scope.Detail.Imcc2s.length > 0 && $scope.Detail.Imcc2s.length >= intRow && is.equal($scope.Detail.Imcc2s[intRow - 1].RowNum, intRow)) {
                // $scope.clearInput();
                checkDimensionQty(DimensionFlag);
                if ($scope.Detail.NextStatus === false) {
                    showImcc2(intRow - 1);
                }
            } else {
                PopupService.Info(popup, 'Already the last one');
            }
        };
        var showImcc2 = function (row) {
            if (row !== null && $scope.Detail.Imcc2s.length >= row) {
                $scope.Detail.Imcc2 = {
                    RowNum: $scope.Detail.Imcc2s[row].RowNum,
                    TrxNo: $scope.Detail.Imcc2s[row].TrxNo,
                    LineItemNo: $scope.Detail.Imcc2s[row].LineItemNo,
                    WarehouseCode: $scope.Detail.Imcc2s[row].WarehouseCode,
                    StoreNo: $scope.Detail.Imcc2s[row].StoreNo,
                    ProductTrxNo: $scope.Detail.Imcc2s[row].ProductTrxNo,
                    ProductCode: $scope.Detail.Imcc2s[row].ProductCode,
                    Description: $scope.Detail.Imcc2s[row].Description,
                    PackingQtyTempValue: $scope.Detail.Imcc2s[row].PackingQtyTempValue,
                    WholeQtyTempValue: $scope.Detail.Imcc2s[row].WholeQtyTempValue,
                    LooseQtyTempValue: $scope.Detail.Imcc2s[row].LooseQtyTempValue,
                    DimensionFlag: $scope.Detail.Imcc2s[row].DimensionFlag,
                    PackingUomCode: $scope.Detail.Imcc2s[row].PackingUomCode,
                    LooseUomCode: $scope.Detail.Imcc2s[row].LooseUomCode,
                    WholeUomCode: $scope.Detail.Imcc2s[row].WholeUomCode,
                };

                setColor($scope.Detail.Imcc2s[row].DimensionFlag);
            }
            if (is.equal(row, $scope.Detail.Imcc2s.length - 1)) {
                $scope.Detail.blnNext = false;
            } else {
                $scope.Detail.blnNext = true;
            }
        };
        var setColor = function (DimensionFlag) {
            var Color = "blue";
            if (DimensionFlag !== '') {
                if (DimensionFlag === '1') {
                    $scope.Detail.Imcc2.setColorPacking = {
                        "color": Color
                    };
                } else if (DimensionFlag === '2') {
                    $scope.Detail.Imcc2.setColorWhole = {
                        "color": Color
                    };
                } else if (DimensionFlag === '3') {
                    $scope.Detail.Imcc2.setColorLoose = {
                        "color": Color
                    };
                } else {}
            }
        };

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
                    showImcc2(0);

                });
            });
        };
        GetImcc2ProductTrxNo($scope.Detail.TrxNo);
    }
]);
