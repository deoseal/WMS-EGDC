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
        public List<Imgi2_Picking> Get_Imgi2_Picking_List(Imgi request)
        {
            List<Imgi2_Picking> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    List<Impa1> impa1 = db.Select<Impa1>("Select * from Impa1");
                    string strBarCodeFiled = impa1[0].BarCodeField;
                    string[] strBarCodeList = strBarCodeFiled.Split(',');
                    if (strBarCodeList.Length <= 1)
                    {
                        string strSql = "Select RowNum = ROW_NUMBER() OVER (ORDER BY Imgi2.StoreNo ASC), " +
                                    "Imgi2.*, " +
                                    "(Select Top 1 UserDefine1 From Impm1 Where TrxNo=Imgi2.ReceiptMovementTrxNo) AS SerialNo," +
                                    "(Select Top 1 " + strBarCodeFiled + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode," +
                                    "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS SerialNoFlag," +
                                    "(CASE Imgi2.DimensionFlag When '1' THEN Imgi2.PackingQty When '2' THEN Imgi2.WholeQty ELSE Imgi2.LooseQty END) AS Qty, " +
                                    "0 AS QtyBal, 0 AS ScanQty,ReceiptMovementTrxNo, UserDefine2 as  PackingNo " +
                                    "From Imgi2 " +
                                    "Left Join Imgi1 On Imgi2.TrxNo=Imgi1.TrxNo " +
                                    "Where IsNull(Imgi1.StatusCode,'')='USE' And Imgi1.GoodsIssueNoteNo='" + Modfunction.SQLSafe(request.GoodsIssueNoteNo) + "'";
                        Result = db.Select<Imgi2_Picking>(strSql);
                    }
                    else
                    {
                        for (int i = 0; i < strBarCodeList.Length; i++)
                        {
                            if (Result == null || Result.Count == 0)
                            {
                                string strSql = "Select RowNum = ROW_NUMBER() OVER (ORDER BY Imgi2.StoreNo ASC), " +
                                   "Imgi2.*, " +
                                   "(Select Top 1 UserDefine1 From Impm1 Where TrxNo=Imgi2.ReceiptMovementTrxNo) AS SerialNo," +
                                   "(Select Top 1 " + strBarCodeList[i] + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode," +
                                   "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS SerialNoFlag," +
                                   "(CASE Imgi2.DimensionFlag When '1' THEN Imgi2.PackingQty When '2' THEN Imgi2.WholeQty ELSE Imgi2.LooseQty END) AS Qty, " +
                                   "0 AS QtyBal, 0 AS ScanQty,ReceiptMovementTrxNo " +
                                   "From Imgi2 " +
                                   "Left Join Imgi1 On Imgi2.TrxNo=Imgi1.TrxNo " +
                                   "Where IsNull(Imgi1.StatusCode,'')='USE' And Imgi1.GoodsIssueNoteNo='" + Modfunction.SQLSafe(request.GoodsIssueNoteNo) + "'";
                                Result = db.Select<Imgi2_Picking>(strSql);
                            }
                        }
                            }
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
                    List<Impa1> impa1 = db.Select<Impa1>("Select * from Impa1");
                    string strBarCodeFiled = impa1[0].BarCodeField;
                    string strSql = "";
                    string[] strBarCodeList = strBarCodeFiled.Split(',');
                    if (strBarCodeList.Length <= 1)
                    {
                        strSql = "Select RowNum = ROW_NUMBER() OVER (ORDER BY Imgi2.StoreNo ASC), " +
                                                           "Imgi2.*, " +
                                                           "(Select Top 1 UserDefine1 From Impm1 Where TrxNo=Imgi2.ReceiptMovementTrxNo) AS SerialNo," +
                                                           "(Select Top 1 " + strBarCodeFiled + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode," +
                                                           "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS SerialNoFlag," +
                                                           "(CASE Imgi2.DimensionFlag When '1' THEN Imgi2.PackingQty When '2' THEN Imgi2.WholeQty ELSE Imgi2.LooseQty END) AS Qty, " +
                                                           "0 AS QtyBal, 0 AS ScanQty,ReceiptMovementTrxNo " +
                                                           "From Imgi2 " +
                                                           "Left Join Imgi1 On Imgi2.TrxNo=Imgi1.TrxNo " +
                                                           "Where (IsNull(Imgi1.StatusCode,'')='USE' Or IsNull(Imgi1.StatusCode,'')='CMP') And Imgi1.GoodsIssueNoteNo='" + Modfunction.SQLSafe(request.GoodsIssueNoteNo) + "'";
                        Result = db.Select<Imgi2_Verify>(strSql);
                    }
                    else {

                        for (int i = 0; i < strBarCodeList.Length; i++)
                        {
                            if (Result == null || Result.Count == 0)
                            {
                                strSql = "Select RowNum = ROW_NUMBER() OVER (ORDER BY Imgi2.StoreNo ASC), " +
                                                              "Imgi2.*, " +
                                                              "(Select Top 1 UserDefine1 From Impm1 Where TrxNo=Imgi2.ReceiptMovementTrxNo) AS SerialNo," +
                                                              "(Select Top 1 " + strBarCodeList[i] + " From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS BarCode," +
                                                              "(Select Top 1 SerialNoFlag From Impr1 Where TrxNo=Imgi2.ProductTrxNo) AS SerialNoFlag," +
                                                              "(CASE Imgi2.DimensionFlag When '1' THEN Imgi2.PackingQty When '2' THEN Imgi2.WholeQty ELSE Imgi2.LooseQty END) AS Qty, " +
                                                              "0 AS QtyBal, 0 AS ScanQty,ReceiptMovementTrxNo " +
                                                              "From Imgi2 " +
                                                              "Left Join Imgi1 On Imgi2.TrxNo=Imgi1.TrxNo " +
                                                              "Where (IsNull(Imgi1.StatusCode,'')='USE' Or IsNull(Imgi1.StatusCode,'')='CMP') And Imgi1.GoodsIssueNoteNo='" + Modfunction.SQLSafe(request.GoodsIssueNoteNo) + "'";
                                Result = db.Select<Imgi2_Verify>(strSql);
                            }
                        }
                    }
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
                        Result = db.Update<Imgr2>(
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
                        Result = db.Update<Imgr2>(
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
                        Result = db.Update<Imgr2>(
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
