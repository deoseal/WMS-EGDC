using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data;
using ServiceStack;
using ServiceStack.ServiceHost;
using ServiceStack.OrmLite;
using WebApi.ServiceModel.Tables;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace WebApi.ServiceModel.Wms
{
    [Route("/wms/imcc1", "Get")]   //imcc1?CustomerCode ,imcc1?TrxNo
    [Route("/wms/imcc2", "Get")]     //imcc2?TrxNo
    [Route("/wms/imcc2/confirm", "Post")]
    public class imcc : IReturn<CommonResponse>
    {
        public string CustomerCode { get; set; }
        public int TrxNo { get; set; }
        public string UpdateAllString { get; set; }
    }
    public class imcc_loigc
    {
        public IDbConnectionFactory DbConnectionFactory { get; set; }
        public List<Imcc1> Get_Imcc1_List(imcc request)
        {
            List<Imcc1> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    if (!string.IsNullOrEmpty(request.CustomerCode))
                    {
                                    Result = db.SelectParam<Imcc1>(
                                        i => i.CustomerCode != null && i.CustomerCode != "" && i.CustomerCode == request.CustomerCode
                            ).OrderByDescending(i => i.CycleCountDateTime).ToList<Imcc1>();
                      
                    }
                    else if (request.TrxNo>0)
                    {
                        
                            Result = db.SelectParam<Imcc1>(
                                            i => i.TrxNo >0 && i.TrxNo == request.TrxNo
                            ).OrderByDescending(i => i.CycleCountDateTime).ToList<Imcc1>();
                        
                      
                    }

                }
            }
            catch { throw; }
            return Result;
        }


        public List<Imcc2> Get_Imcc2_List(imcc request)
        {
            List<Imcc2> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    string strSql = " select TrxNo ,LineItemNo ,WarehouseCode ,StoreNo ,ProductTrxNo ,'' as Description,'' as PackingQtyTempValue ,'' as WholeQtyTempValue ,'' as LooseQtyTempValue, " +
                                    " isnull((select DimensionFlag from impr1 where impr1.TrxNo =imcc2.ProductTrxNo),'') as DimensionFlag, " +
                                    " isnull((select PackingUomCode from impr1 where impr1.TrxNo =imcc2.ProductTrxNo),'') as PackingUomCode, " +
                                    " isnull((select LooseUomCode from impr1 where impr1.TrxNo =imcc2.ProductTrxNo),'') as LooseUomCode, " +
                                    " isnull((select WholeUomCode from impr1 where impr1.TrxNo =imcc2.ProductTrxNo),'') as WholeUomCode,  " +
                                    " isnull((select ProductCode from impr1 where  impr1.TrxNo=imcc2.ProductTrxNo),'') as  ProductCode ," +
                                    " isnull((select CustomerCode from imcc1 where  imcc1.TrxNo=imcc2.TrxNo),'') as  CustomerCode ," +
                                    "   RowNum = ROW_NUMBER() OVER (ORDER BY Imcc2.lineItemNo ASC) " +
                        " from Imcc2 " +
                                    " Where Imcc2.TrxNo='" + request.TrxNo + "' order by LineItemNo";
                    Result = db.Select<Imcc2>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }

        public int ConfirmAll_Imcc2(imcc request)
        {
            int Result = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection())
                {
                    if (request.UpdateAllString != null && request.UpdateAllString != "")
                    {
                        JArray ja = (JArray)JsonConvert.DeserializeObject(request.UpdateAllString);
                        if (ja != null)
                        {    
                           
                            for (int i = 0; i < ja.Count(); i++)
                            {
                                int TrxNo;
                                int LineItemNo;
                                int ProductTrxNo=0;
                                int PackingQty;
                                int WholeQty;
                                int LooseQty;
                           
                                if (ja[i]["TrxNo"] != null || ja[i]["TrxNo"].ToString() != "") {
                                    if (ja[i]["LineItemNo"] != null || ja[i]["LineItemNo"].ToString() != "") {
                                        TrxNo = int.Parse(ja[i]["TrxNo"].ToString());
                                        LineItemNo = int.Parse(ja[i]["LineItemNo"].ToString());
                                        if (ja[i]["ProductTrxNo"] != null || ja[i]["ProductTrxNo"].ToString() != "") {
                                            ProductTrxNo = int.Parse(ja[i]["ProductTrxNo"].ToString());
                                        }
                                        
                                        if (ja[i]["PackingQtyTempValue"].ToString() == "")
                                        {
                                            PackingQty = 0;
                                        }
                                        else
                                        {
                                            PackingQty = int.Parse(ja[i]["PackingQtyTempValue"].ToString());
                                        }
                                        if (ja[i]["WholeQtyTempValue"].ToString() == "")
                                        {
                                            WholeQty = 0;
                                        }
                                        else
                                        {
                                            WholeQty = int.Parse(ja[i]["WholeQtyTempValue"].ToString());
                                        }
                                        if (ja[i]["LooseQtyTempValue"].ToString() == "")
                                        {
                                            LooseQty = 0;
                                        }
                                        else {
                                            LooseQty = int.Parse(ja[i]["LooseQtyTempValue"].ToString());
                                        }
                                       
                                        db.ExecuteSql("insert into impm1 (CustomerCode, WarehouseCode, StoreNo,ProductCode ,Description, DimensionFlag, PackingQty, WholeQty,LooseQty,ProductTrxNo,UpdateBy) values (" +
                                                        Modfunction.SQLSafeValue(ja[i]["CustomerCode"].ToString()) + "," +  Modfunction.SQLSafeValue(ja[i]["WarehouseCode"].ToString()) + "," +  Modfunction.SQLSafeValue(ja[i]["StoreNo"].ToString()) + "," + Modfunction.SQLSafeValue(ja[i]["ProductCode"].ToString()) + "," +  Modfunction.SQLSafeValue(ja[i]["Description"].ToString()) + "," +
                                                        Modfunction.SQLSafeValue(ja[i]["DimensionFlag"].ToString()) + "," + PackingQty + "," + WholeQty + "," + LooseQty + "," + ProductTrxNo + "," + Modfunction.SQLSafeValue(ja[i]["UserId"].ToString()) + ")");

                                        string str;
                                        string strTableName = "imcc2";
                                        str = " PackingQty = " + PackingQty+ ",WholeQty = " + WholeQty + ",LooseQty = " +LooseQty+ ", UpdateBy="+ Modfunction.SQLSafeValue(ja[i]["UserId"].ToString()) + "";
                                        db.Update(strTableName,
                                               str,
                                               " TrxNo=" + TrxNo + " and LineItemNo=" + LineItemNo + "");

                                    }
                                 
                                }


                            }
                            Result = 1;
                        }
                    }
                }
            }
            catch { throw; }
            return Result;
        }

    }
}
