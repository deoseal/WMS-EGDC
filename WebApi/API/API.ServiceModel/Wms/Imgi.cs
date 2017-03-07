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
    [Route("/wms/imgi1", "Get")]                //imgi1?GoodsIssueNoteNo= &CustomerCode= &StatusCode=
    [Route("/wms/imgi1/update", "Get")]             //imgi1?TrxNo= &UserID= &StatusCode=
    [Route("/wms/imgi2", "Get")]                //imgi2?GoodsIssueNoteNo=
    [Route("/wms/imgi2/picking", "Get")]                //picking?GoodsIssueNoteNo=
    [Route("/wms/imgi2/verify", "Get")]					//verify?GoodsIssueNoteNo=
    [Route("/wms/imgi2/qtyremark", "Get")]
    [Route("/wms/imgi2/packingno", "Get")]
    [Route("/wms/imgi3/picking/confim", "Get")]

    public class Imgi : IReturn<CommonResponse>
    {
        public string CustomerCode { get; set; }
        public string GoodsIssueNoteNo { get; set; }
        public string TrxNo { get; set; }
        public string LineItemNo { get; set; }
        public string UserID { get; set; }
        public string StatusCode { get; set; }
        public string ReceiptMovementTrxNo { get; set; }
        public string QtyRemark { get; set; }
        public string QtyRemarkQty { get; set; }
        public string QtyRemarkBackQty { get; set; }
        public string QtyFieldName { get; set; }
        public string PackingNo { get; set; }

        public string LineItemNoList { get; set; }
        public string QtyList { get; set; }
        public string PackingNoList { get; set; }
        public string ProductDescriptionList { get; set; }
        public string ProductTrxNoList { get; set; }
        public string ProductCodeList { get; set; }
        public string DimensionFlag { get; set; }

     
    }
    public class Imgi_Logic
    {
        public IDbConnectionFactory DbConnectionFactory { get; set; }
        public List<Imgi1> Get_Imgi1_List(Imgi request)
        {
            List<Imgi1> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    if (!string.IsNullOrEmpty(request.CustomerCode))
                    {
                        if (!string.IsNullOrEmpty(request.StatusCode))
                        {
                            Result = db.SelectParam<Imgi1>(
                                        i => i.CustomerCode != null && i.CustomerCode != "" && i.StatusCode != null && i.StatusCode != "DEL" && i.StatusCode != "EXE" && i.CustomerCode == request.CustomerCode
                            ).OrderByDescending(i => i.IssueDateTime).ToList<Imgi1>();
                        }
                        else
                        {
                            Result = db.SelectParam<Imgi1>(
                                            i => i.CustomerCode != null && i.CustomerCode != "" && i.StatusCode != null && i.StatusCode != "DEL" && i.StatusCode != "EXE" && i.StatusCode != "CMP" && i.CustomerCode == request.CustomerCode
                            ).OrderByDescending(i => i.IssueDateTime).ToList<Imgi1>();
                        }

                    }
                    else if (!string.IsNullOrEmpty(request.GoodsIssueNoteNo))
                    {
                        if (!string.IsNullOrEmpty(request.StatusCode))
                        {
                            Result = db.SelectParam<Imgi1>(
                                            i => i.CustomerCode != null && i.CustomerCode != "" && i.StatusCode != null && i.StatusCode != "DEL" && i.StatusCode != "EXE" && i.GoodsIssueNoteNo.StartsWith(request.GoodsIssueNoteNo)
                            ).OrderByDescending(i => i.IssueDateTime).ToList<Imgi1>();
                        }
                        else
                        {
                            Result = db.SelectParam<Imgi1>(
                                            i => i.CustomerCode != null && i.CustomerCode != "" && i.StatusCode != null && i.StatusCode != "DEL" && i.StatusCode != "EXE" && i.StatusCode != "CMP" && i.GoodsIssueNoteNo.StartsWith(request.GoodsIssueNoteNo)
                            ).OrderByDescending(i => i.IssueDateTime).ToList<Imgi1>();
                        }

                    }
                }
            }
            catch { throw; }
            return Result;
        }

        public int Comfirm_Picking_Imgi3(Imgi request)
        {
            int Result = -1;
            try
            {

 
                if (request.TrxNo != null && request.TrxNo.Trim() != "")
                {

                    string[] LineItemNoList = request.LineItemNoList.Split(',');
                           
                    string [] ProductCodeList=  request.ProductCodeList.Split(',');
                    string[] QtyList = request.QtyList.Split(',');
                    string[] PackingNoList = request.PackingNoList.Split(',');
                    string[] ProductDescriptionList = request.ProductDescriptionList.Split(',');
                    string[] ProductTrxNoList = request.ProductTrxNoList.Split(',');
                 
   
              
               using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
               {
                        string strPackingListDone = "";
                        string strCurrentPackingNo = "";
                        int PackingQty = 0, WholeQty = 0, LooseQty = 0;
                        for (int i = 1; i < LineItemNoList.Length; i++) {
                            if (strPackingListDone != "" && strPackingListDone .IndexOf(PackingNoList[i] + ',' + ProductCodeList[i])>0)
                            {
                                continue;
                            }
                            strCurrentPackingNo = PackingNoList[i] + ',' + ProductCodeList[i];
                            int intQty = int.Parse (QtyList[i]);
                            for (int j = i + 1; j < LineItemNoList.Length; j++)
                            {
                                if (strCurrentPackingNo == PackingNoList[j] + ',' + ProductCodeList[j])
                                {
                                    intQty = intQty+ int.Parse(QtyList[j]);
                                }
                            }
                         
                            if (request.DimensionFlag != null && request.DimensionFlag != "") {
                            
                                switch (request.DimensionFlag) {
                                    case "1":
                                        PackingQty = intQty;
                                        break;
                                    case "2":
                                        WholeQty = intQty;
                                        break;
                                    case "3":
                                        LooseQty = intQty;
                                        break;
                                }
                            }
                            int intMaxLineItemNo = 1;

                            List<Imgi3> list1 = db.Select<Imgi3>("Select Max(LineItemNo) LineItemNo from Imgi3 Where TrxNo = " + Modfunction.SQLSafeValue(request.TrxNo));
                            if (list1 != null)
                            {
                                if (list1[0].LineItemNo > 0)
                                    intMaxLineItemNo = list1[0].LineItemNo + 1;
                            }
                                       db.ExecuteSql("insert into imgi3 (TrxNo, LineItemNo, PackingNo,ProductTrxNo, ProductDescription,PackingQty, WholeQty, LooseQty,Volume) values (" +
                            Modfunction.SQLSafe(request.TrxNo) + "," + intMaxLineItemNo + "," + Modfunction.SQLSafeValue(PackingNoList[i].ToString()) + "," + int.Parse (ProductTrxNoList[i].ToString() )+ " ," + Modfunction.SQLSafeValue(ProductDescriptionList[i].ToString()) + ","+PackingQty + "," + WholeQty + "," + LooseQty + " ,0 )");

          

                            strPackingListDone = strPackingListDone + ',' + strCurrentPackingNo;
                        }
                //    string UpdateNewFlag = "N";
                //    if (request.NewFlagList == null || request.NewFlagList.Trim() == "")
                //    {
                //        Result = db.SqlScalar<int>("EXEC spi_Imgr2_Mobile @TrxNo,@LineItemNo,@NewFlag,@DimensionQty,@QtyRemark,@DimensionFlag,@StoreNo,@UpdateBy", new { TrxNo = int.Parse(request.TrxNo), LineItemNo = int.Parse(request.LineItemNoList), NewFlag = UpdateNewFlag, DimensionQty = int.Parse(request.DimensionQtyList), QtyRemark = request.QtyRemarkList, DimensionFlag = request.DimensionFlagList, StoreNo = request.StoreNoList, UpdateBy = request.UserID });
                //    }
                //    else
                //    {
                //        for (int i = 0; i < DimensionFlagDetail.Length; i++)
                //        {
                //            UpdateNewFlag = NewFlagDetail[i];
                //            if (UpdateNewFlag != "Y")
                //            { UpdateNewFlag = "N"; }
                //            Result = db.SqlScalar<int>("EXEC spi_Imgr2_Mobile @TrxNo,@LineItemNo,@NewFlag,@DimensionQty,@QtyRemark,@DimensionFlag,@StoreNo,@UpdateBy", new { TrxNo = int.Parse(request.TrxNo), LineItemNo = int.Parse(LineItemNoDetail[i]), NewFlag = UpdateNewFlag, DimensionQty = DimensionQtyDetail[i], QtyRemark = QtyRemarkDetail[i], DimensionFlag = DimensionFlagDetail[i], StoreNo = StoreNoDetail[i], UpdateBy = request.UserID });
                //        }
                //    }
                //    Result = db.SqlScalar<int>("EXEC spi_Imgr_Confirm @TrxNo,@UpdateBy", new { TrxNo = int.Parse(request.TrxNo), UpdateBy = request.UserID });
                //    if (Result != -1)
                //    {
                //        List<Imgr2_Receipt> Result1 = null;
                //        Result1 = db.Select<Imgr2_Receipt>(
                //                                "select Imgr1.GoodsReceiptNoteNo,Imgr1.CustomerCode,Imgr2.LineItemNo,Imgr1.TrxNo from imgr1 join imgr2 on imgr1.TrxNo =imgr2.TrxNo where Imgr1.TrxNo =  '" + request.TrxNo + "' "
                //                );
                //        if (Result1 != null && Result1.Count > 0)
                //        {
                //            for (int i = 0; i < Result1.Count; i++)
                //            {
                //                Result = db.SqlScalar<int>("Update Imgr2 Set MovementTrxNo=(Select top 1 TrxNo From Impm1 Where BatchNo=@GoodsReceiptNoteNo And BatchLineItemNo=@BatchLineItemNo And CustomerCode=@CustomerCode) Where TrxNo=@TrxNo  And LineItemNo=@LineItemNo", new { GoodsReceiptNoteNo = Result1[i].GoodsReceiptNoteNo, BatchLineItemNo = Result1[i].LineItemNo, CustomerCode = Result1[i].CustomerCode, TrxNo = int.Parse(request.TrxNo), LineItemNo = Result1[i].LineItemNo });
                //            }
                //        }
                //    }
                }
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
                            BarCodeFieldList = "(Select Top 1 " + strBarCodeList[0] + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode,(Select Top 1 " + strBarCodeList[0] + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode1,";
                        }
                        else
                        {
                            if (strBarCodeList.Length > i)
                            {
                                BarCodeFieldList = BarCodeFieldList + "(Select Top 1 " + strBarCodeList[i] + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode" + (i + 1).ToString() + ",";
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

        public List<Imgi2_Picking> Get_Imgi2_Picking_List(Imgi request)
        {
            List<Imgi2_Picking> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string strSql = "Select RowNum = ROW_NUMBER() OVER (ORDER BY Imgi2.StoreNo ASC), " +
                                    "Imgi2.*, " +
                                    "(Select Top 1 UserDefine1 From Impm1 Where TrxNo=Imgi2.ReceiptMovementTrxNo) AS SerialNo," +
                                    "" + getBarCodeListSelect() +
                                    "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS SerialNoFlag," +
                                    "(CASE Imgi2.DimensionFlag When '1' THEN Imgi2.PackingQty When '2' THEN Imgi2.WholeQty ELSE Imgi2.LooseQty END) AS Qty, " +
                                    "0 AS QtyBal, 0 AS ScanQty,ReceiptMovementTrxNo, UserDefine2 as  PackingNo " +
                                    "From Imgi2 " +
                                    "Left Join Imgi1 On Imgi2.TrxNo=Imgi1.TrxNo " +
                                    "Where IsNull(Imgi1.StatusCode,'')='USE' And Imgi1.GoodsIssueNoteNo='" + Modfunction.SQLSafe(request.GoodsIssueNoteNo) + "'";
                    Result = db.Select<Imgi2_Picking>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }
        public List<Imgi2_Verify> Get_Imgi2_Verify_List(Imgi request)
        {
            List<Imgi2_Verify> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string strSql = "";
                    strSql = "Select RowNum = ROW_NUMBER() OVER (ORDER BY Imgi2.StoreNo ASC), " +
                            "Imgi2.*, " +
                            "(Select Top 1 UserDefine1 From Impm1 Where TrxNo=Imgi2.ReceiptMovementTrxNo) AS SerialNo," +
                            "" + getBarCodeListSelect() +
                            "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS SerialNoFlag," +
                            "(CASE Imgi2.DimensionFlag When '1' THEN Imgi2.PackingQty When '2' THEN Imgi2.WholeQty ELSE Imgi2.LooseQty END) AS Qty, " +
                            "0 AS QtyBal, 0 AS ScanQty,ReceiptMovementTrxNo " +
                            "From Imgi2 " +
                            "Left Join Imgi1 On Imgi2.TrxNo=Imgi1.TrxNo " +
                            "Where (IsNull(Imgi1.StatusCode,'')='USE' Or IsNull(Imgi1.StatusCode,'')='CMP') And Imgi1.GoodsIssueNoteNo='" + Modfunction.SQLSafe(request.GoodsIssueNoteNo) + "'";
                    Result = db.Select<Imgi2_Verify>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }

        public int Update_Imgi1_Status(Imgi request)
        {
            int Result = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    Result = db.Update<Imgi1>(
                                    new
                                    {
                                        StatusCode = request.StatusCode,
                                        CompleteBy = request.UserID,
                                        CompleteDate = DateTime.Now
                                    },
                                    p => p.TrxNo == int.Parse(request.TrxNo)
                    );
                }
            }
            catch { throw; }
            return Result;
        }

        public int Update_Imgi2_PackingNo(Imgi request)
        {
            int Result = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    Result = db.Update<Imgi2>(
                                    new
                                    {
                                        UserDefine2 = request.PackingNo
                                    },
                                    p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                    );
                }
            }
            catch { throw; }
            return Result;
        }
        public int Update_Imgi2_QtyRemark(Imgi request)
        {
            Update_Imgi2_PackingNo(request);
            int Result = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    if (request.QtyFieldName == "PackingQty")
                    {
                        Result = db.Update<Imgi2>(
                             new
                             {
                                 PackingQty = request.QtyRemarkQty,
                                 UpdateBy = request.UserID
                             },
                        p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                       );
                        Result = db.Update("Impm1", "BalancePackingQty = BalancePackingQty + " + request.QtyRemarkBackQty
                              ,
                         " TrxNo = " + Modfunction.SQLSafeValue(request.ReceiptMovementTrxNo)
                        );
                    }
                    else if (request.QtyFieldName == "WholeQty")
                    {
                        Result = db.Update<Imgi2>(
                              new
                              {
                                  WholeQty = request.QtyRemarkQty,
                                  UpdateBy = request.UserID
                              },
                         p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                        );
                        Result = db.Update("Impm1", "BalanceWholeQty = BalanceWholeQty + " + request.QtyRemarkBackQty
                              ,
                         " TrxNo = " + Modfunction.SQLSafeValue(request.ReceiptMovementTrxNo)
                        );
                    }
                    else
                    {
                        Result = db.Update<Imgi2>(
                              new
                              {
                                  LooseQty = request.QtyRemarkQty,
                                  UpdateBy = request.UserID
                              },
                         p => p.TrxNo == int.Parse(request.TrxNo) && p.LineItemNo == int.Parse(request.LineItemNo)
                        );
                        Result = db.Update("Impm1", "BalanceLooseQty = BalanceLooseQty + " + request.QtyRemarkBackQty
                              ,
                         " TrxNo = " + Modfunction.SQLSafeValue(request.ReceiptMovementTrxNo)
                        );
                    }
                    Result = db.Update<Imgi1>(" Remark=isnull(Remark,'') + (case isnull(Remark,'') when '' then '' else char(13)+char(10)  end) + " + Modfunction.SQLSafeValue(request.QtyRemark) + ",UpdateDateTime = getdate(),UpdateBy = " + Modfunction.SQLSafeValue(request.UserID)
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
