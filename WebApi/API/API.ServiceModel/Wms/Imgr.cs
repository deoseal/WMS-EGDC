using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data;
using ServiceStack;
using ServiceStack.ServiceHost;
using ServiceStack.OrmLite;
using WebApi.ServiceModel.Tables;

namespace WebApi.ServiceModel.Wms
{
    [Route("/wms/imgr1", "Get")]                                                //imgr1?GoodsReceiptNoteNo= & CustomerCode= & StatusCode=
    [Route("/wms/imgr1/confirm", "Get")]                //confirm?TrxNo= &UserID=
    [Route("/wms/imgr2/receipt", "Get")]                //receipt?GoodsReceiptNoteNo=
    [Route("/wms/imgr2/putaway", "Get")]                //putaway?GoodsReceiptNoteNo=
    [Route("/wms/imgr2/putaway/update", "Get")]             //update?StoreNo= & TrxNo= & LineItemNo=
    [Route("/wms/imgr2/transfer", "Get")]			//transfer?GoodsReceiptNoteNo=
    [Route("/wms/imgr2/qtyremark", "Get")]
    public class Imgr : IReturn<CommonResponse>
    {
        public string GoodsReceiptNoteNo { get; set; }
        public string StatusCode { get; set; }
        public string TrxNo { get; set; }
        public string UserID { get; set; }
        public string StoreNo { get; set; }
        public string LineItemNo { get; set; }
        public string QtyRemark { get; set; }
        public string QtyRemarkQty { get; set; }
        public string QtyFieldName { get; set; }
        public string CustomerCode { get; set; }

        public string QtyRemarkList { get; set; }
        public string LineItemNoList { get; set; }
        public string DimensionFlagList { get; set; }
        public string NewFlagList { get; set; }
        public string DimensionQtyList { get; set; }

    }
    public class Imgr_Logic
    {
        public IDbConnectionFactory DbConnectionFactory { get; set; }
        public List<Imgr1> Get_Imgr1_List(Imgr request)
        {
            List<Imgr1> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    if (!string.IsNullOrEmpty(request.CustomerCode))
                    {
                        if (string.IsNullOrEmpty(request.StatusCode))
                        {
                            //Result = db.SelectParam<Imgr1>(
                            //				i => i.GoodsReceiptNoteNo != null && i.GoodsReceiptNoteNo != "" && i.StatusCode != null && i.StatusCode != "DEL" && i.StatusCode != "EXE" && i.StatusCode != "CMP" && i.CustomerCode == request.CustomerCode
                            //).OrderByDescending(i => i.ReceiptDate).ToList<Imgr1>();
                            Result = db.Select<Imgr1>(
                                            "Select Top 10 Imgr1.* From Imgr1 " +
                                            "Where IsNull(GoodsReceiptNoteNo,'')<>'' And IsNUll(StatusCode,'')<>'DEL' And IsNUll(StatusCode,'')<>'EXE' And IsNUll(StatusCode,'')<>'CMP' " +
                                            "And IsNUll(CustomerCode,'') = '" + request.CustomerCode + "' " +
                                            "Order By Imgr1.ReceiptDate Desc"
                            );
                        }
                        else
                        {
                            //Result = db.SelectParam<Imgr1>(
                            //				i => i.GoodsReceiptNoteNo != null && i.GoodsReceiptNoteNo != "" && i.StatusCode == request.StatusCode && i.CustomerCode == request.CustomerCode
                            //).OrderByDescending(i => i.ReceiptDate).ToList<Imgr1>();
                            if (request.StatusCode == "EXE")
                            {
                                Result = db.Select<Imgr1>(
                                                "Select Top 10 Imgr1.* From Imgr1 " +
                                                "Where IsNull(GoodsReceiptNoteNo,'')<>'' " +
                                                "And (IsNUll(StatusCode,'') != 'EXE' AND IsNUll(StatusCode,'') != 'DEL') " +
                                                "And IsNUll(CustomerCode,'') = '" + request.CustomerCode + "' " +
                                                "Order By Imgr1.ReceiptDate Desc"
                                );
                            }
                            else {
                                Result = db.Select<Imgr1>(
                                            "Select Top 10 Imgr1.* From Imgr1 " +
                                            "Where IsNull(GoodsReceiptNoteNo,'')<>'' " +
                                            "And IsNUll(StatusCode,'') = '" + request.StatusCode + "' " +
                                            "And IsNUll(CustomerCode,'') = '" + request.CustomerCode + "' " +
                                            "Order By Imgr1.ReceiptDate Desc"
                            );
                            }
                            
                        }
                    }
                    else if (!string.IsNullOrEmpty(request.GoodsReceiptNoteNo))
                    {
                        if (string.IsNullOrEmpty(request.StatusCode))
                        {
                            //Result = db.SelectParam<Imgr1>(
                            //					i => i.GoodsReceiptNoteNo != null && i.GoodsReceiptNoteNo != "" && i.StatusCode != null && i.StatusCode != "DEL" && i.StatusCode != "EXE" && i.StatusCode != "CMP" && i.GoodsReceiptNoteNo.StartsWith(request.GoodsReceiptNoteNo)
                            //);
                            Result = db.Select<Imgr1>(
                                            "Select Top 10 Imgr1.* From Imgr1 " +
                                            "Where IsNUll(StatusCode,'')<>'DEL' And IsNUll(StatusCode,'')<>'EXE' And IsNUll(StatusCode,'')<>'CMP' " +
                                            "And (Select count(*) from Imgr2 Where Imgr2.TrxNo=Imgr1.TrxNo) > 0 " +
                                            "And IsNUll(GoodsReceiptNoteNo,'') LIKE '" + request.GoodsReceiptNoteNo + "%'"
                            );
                        }
                        else
                        {
                            //Result = db.SelectParam<Imgr1>(
                            //					i => i.GoodsReceiptNoteNo != null && i.GoodsReceiptNoteNo != "" && i.StatusCode == request.StatusCode && i.GoodsReceiptNoteNo.StartsWith(request.GoodsReceiptNoteNo)
                            //);
                            Result = db.Select<Imgr1>(
                                            "Select Top 10 Imgr1.* From Imgr1 " +
                                            "Where IsNUll(StatusCode,'')='" + request.StatusCode + "' " +
                                            "And (Select count(*) from Imgr2 Where Imgr2.TrxNo=Imgr1.TrxNo) > 0 " +
                                            "And IsNUll(GoodsReceiptNoteNo,'') LIKE '" + request.GoodsReceiptNoteNo + "%'"
                            );
                        }
                    }
                }
            }
            catch { throw; }
            return Result;
        }
        public List<Imgr2> Get_Imgr2_List(Imgr request)
        {
            List<Imgr2> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    Result = db.Select<Imgr2>(
                                    "Select Imgr2.*,'' As QtyStatus From Imgr2 " +
                                    "Left Join Imgr1 On Imgr2.TrxNo = Imgr1.TrxNo " +
                                    "Where Imgr1.GoodsReceiptNoteNo='" + request.GoodsReceiptNoteNo + "'"
                    );
                }
            }
            catch { throw; }
            return Result;
        }

        public string[] getBarCodeFromImpa1()
        {
            string[] strBarCodeList = null;
            using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
            {
                List<Impa1> impa1 = db.Select<Impa1>("Select * from Impa1");
                string strBarCodeFiled = impa1[0].BarCodeField;
                strBarCodeList = strBarCodeFiled.Split(',');
            }
            return strBarCodeList;
        }

        public string getBarCodeListSelect()
        {
            string BarCodeFieldList = "";
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string[] strBarCodeList = getBarCodeFromImpa1();
                    for (int i = 0; i < 3; i++)
                    {
                        if (BarCodeFieldList == "")
                        {
                            BarCodeFieldList = "(Select Top 1 " + strBarCodeList[0] + " From Impr1 Where TrxNo=Imgr2.ProductTrxNo) AS BarCode,(Select Top 1 " + strBarCodeList[0] + " From Impr1 Where TrxNo=Imgr2.ProductTrxNo) AS BarCode1,";
                        }
                        else
                        {
                            if (strBarCodeList.Length > i)
                            {
                                BarCodeFieldList = BarCodeFieldList + "(Select Top 1 " + strBarCodeList[i] + " From Impr1 Where TrxNo=Imgr2.ProductTrxNo) AS BarCode" + (i + 1).ToString() + ",";
                            }
                            else
                            {
                                BarCodeFieldList = BarCodeFieldList + "'' AS BarCode" + (i + 1).ToString() + ",";
                            }
                        }
                    }
                }
            }
            catch { throw; }
            return BarCodeFieldList;
        }

        public List<Imgr2_Receipt> Get_Imgr2_Receipt_List(Imgr request)
        {
            List<Imgr2_Receipt> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string strSql = "Select Imgr2.*,'' As QtyStatus, " +
                                     "" + getBarCodeListSelect() +
                                     "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgr2.ProductTrxNo) AS SerialNoFlag," +
                                     "0 AS ScanQty,GoodsReceiptNoteNo " +
                                     "From Imgr2 " +
                                     "Left Join Imgr1 On Imgr2.TrxNo = Imgr1.TrxNo " +
                                     "Where Imgr1.GoodsReceiptNoteNo='" + Modfunction.SQLSafe(request.GoodsReceiptNoteNo) + "'";
                    Result = db.Select<Imgr2_Receipt>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }
        public List<Imgr2_Putaway> Get_Imgr2_Putaway_List(Imgr request)
        {
            List<Imgr2_Putaway> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string strSql = "Select Imgr2.TrxNo, Imgr2.LineItemNo, IsNull((Select Top 1 StoreNo from Impm1 Where Impm1.CustomerCode = Imgr1.CustomerCode and Impm1.ProductTrxNo =imgr2.ProductTrxNo AND Impm1.TrxType = '1' Order By Impm1.ReceiptDate DEsc),'') AS StoreNo, IsNull((Select Top 1 StoreNo from Impm1 Where Impm1.CustomerCode = Imgr1.CustomerCode and Impm1.ProductTrxNo =imgr2.ProductTrxNo AND Impm1.TrxType = '1' Order By Impm1.ReceiptDate DEsc),'') AS DefaultStoreNo,0 as ProductIndex," +
                                    "(Select StagingAreaFlag From Whwh2 Where WarehouseCode=Imgr2.WarehouseCode And StoreNo=IsNull((Select Top 1 StoreNo from Impm1 Where Impm1.CustomerCode = Imgr1.CustomerCode and Impm1.ProductTrxNo =imgr2.ProductTrxNo AND Impm1.TrxType = '1' Order By Impm1.ReceiptDate DEsc),'')) AS StagingAreaFlag," +
                                    "IsNull(Imgr2.ProductCode,'') AS ProductCode, IsNull(Imgr2.ProductDescription,'') AS ProductDescription, IsNull(Imgr2.UserDefine1,'') AS UserDefine1," +
                                    "(Case Imgr2.DimensionFlag When '1' Then Imgr2.PackingQty When '2' Then Imgr2.WholeQty Else Imgr2.LooseQty End) AS Qty,(Case Imgr2.DimensionFlag When '1' Then Imgr2.PackingQty When '2' Then Imgr2.WholeQty Else Imgr2.LooseQty End) AS ActualQty," + getBarCodeListSelect() +
                                     "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgr2.ProductTrxNo) AS SerialNoFlag," +
                                     "0 AS ScanQty,Imgr2.DimensionFlag,Imgr2.PackingQty,Imgr2.WholeQty,Imgr2.LooseQty,Imgr1.GoodsReceiptNoteNo,'' As QtyStatus,'' AS NewBarCode,'' AS NewFlag " +
                                    "From Imgr2 " +
                                    "Left Join Imgr1 On Imgr2.TrxNo = Imgr1.TrxNo " +
                                    "Where Imgr1.GoodsReceiptNoteNo='" + request.GoodsReceiptNoteNo + "'";
                    Result = db.Select<Imgr2_Putaway>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }
        public List<Imgr2_Transfer> Get_Imgr2_Transfer_List(Imgr request)
        {
            List<Imgr2_Transfer> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string strSql = "Select Imgr2.TrxNo, Imgr2.LineItemNo, IsNull(Imgr2.StoreNo,'') AS StoreNo," +
                                    "(Select StagingAreaFlag From Whwh2 Where WarehouseCode=Imgr2.WarehouseCode And StoreNo=Imgr2.StoreNo) AS StagingAreaFlag," +
                                    "IsNull(Imgr2.ProductCode,'') AS ProductCode, IsNull(Imgr2.ProductDescription,'') AS ProductDescription," +
                                    "(Case Imgr2.DimensionFlag When '1' Then Imgr2.PackingQty When '2' Then Imgr2.WholeQty Else Imgr2.LooseQty End) AS Balance," +
                                    "0 AS Qty, '' AS NewStoreNo,'' As QtyStatus ," + getBarCodeListSelect() +
                                    "From Imgr2 " +
                                    "Left Join Imgr1 On Imgr2.TrxNo = Imgr1.TrxNo " +
                                    "Where Imgr1.GoodsReceiptNoteNo='" + request.GoodsReceiptNoteNo + "'";
                    Result = db.Select<Imgr2_Transfer>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }
        public int Confirm_Imgr1(Imgr request)
        {
            int Result = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    Result = db.SqlScalar<int>("EXEC spi_Imgr_Confirm @TrxNo,@UpdateBy", new { TrxNo = int.Parse(request.TrxNo), UpdateBy = request.UserID });
                }
            }
            catch { throw; }
            return Result;
        }
        public int Update_Imgr2_StoreNo(Imgr request)
        {
            int Result = -1;
            try
            {
                string[] QtyRemarkDetail = request.QtyRemarkList.Split(',');
                string[] StoreNoDetail = request.StoreNoList.Split(',');
                string[] LineItemNoDetail = request.LineItemNoList.Split(',');
                string[] DimensionFlagDetail = request.DimensionFlagList.Split(',');
                string[] NewFlagDetail = request.NewFlagList.Split(',');
                string[] DimensionQtyDetail = request.DimensionQtyList.Split(',');
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    for (int i = 0; i < QtyRemarkDetail.Length; i++)
                    {
                        Result = db.SqlScalar<int>("@TrxNo,@LineItemNo,@NewFlag,@DimensionQty,@QtyRemark,@DimensionFlag,@UpdateBy", new { TrxNo = int.Parse(request.TrxNo), LineItemNo = int.Parse(LineItemNoDetail[i]), NewFlag = NewFlagDetail[i], DimensionQty = DimensionQtyDetail[i], QtyRemark = QtyRemarkDetail[i], DimensionFlag = DimensionFlagDetail[i], UpdateBy = request.UserID });
                    }
                    Result = db.SqlScalar<int>("EXEC spi_Imgr_Confirm @TrxNo,@UpdateBy", new { TrxNo = int.Parse(request.TrxNo), UpdateBy = request.UserID });
                }
            }
            catch { throw; }
            return Result;
        }

        public int Update_Imgr2_QtyRemark(Imgr request)
        {
            int Result = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    if (request.QtyFieldName == "PackingQty")
                    {
                        Result = db.Update<Imgr2>(
                             new
                             {
                                 PackingQty = request.QtyRemarkQty,
                                 UpdateBy = request.UserID
                             },
                        p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                       );
                        Result = db.Update("Impm1", "BalancePackingQty = " + request.QtyRemarkQty
                              ,
                         " BatchNo = " + Modfunction.SQLSafeValue(request.GoodsReceiptNoteNo) + " AND BatchLineItemNo = " + Modfunction.SQLSafeValue(request.LineItemNo)
                        );
                    }
                    else if (request.QtyFieldName == "WholeQty")
                    {
                        Result = db.Update<Imgr2>(
                              new
                              {
                                  WholeQty = request.QtyRemarkQty,
                                  UpdateBy = request.UserID
                              },
                         p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                        );
                        Result = db.Update("Impm1", "BalanceWholeQty = " + request.QtyRemarkQty
                              ,
                         " BatchNo = " + Modfunction.SQLSafeValue(request.GoodsReceiptNoteNo) + " AND BatchLineItemNo = " + Modfunction.SQLSafeValue(request.LineItemNo)
                        );
                    }
                    else
                    {
                        Result = db.Update<Imgr2>(
                              new
                              {
                                  LooseQty = request.QtyRemarkQty,
                                  UpdateBy = request.UserID
                              },
                         p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                        );
                        Result = db.Update("Impm1", "BalanceLooseQty = " + request.QtyRemarkQty
                              ,
                         " BatchNo = " + Modfunction.SQLSafeValue(request.GoodsReceiptNoteNo) + " AND BatchLineItemNo = " + Modfunction.SQLSafeValue(request.LineItemNo)
                        );
                    }
                    Result = db.Update<Imgr1>(" Remark=isnull(Remark,'') + (case isnull(Remark,'') when '' then '' else char(13)+char(10)  end) + " + Modfunction.SQLSafeValue(request.QtyRemark) + ",UpdateDateTime = getdate(),UpdateBy = " + Modfunction.SQLSafeValue(request.UserID)
                        ,
                     " TrxNo = " + request.TrxNo
                    );
                }
            }
            catch { throw; }
            return Result;
        }
    }
}
