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
    [Route("/wms/imcc1", "Get")]   //imcc1?CustomerCode ,imcc1?TrxNo
    [Route("/wms/imcc2", "Get")]     //imcc2?TrxNo
    public class imcc : IReturn<CommonResponse>
    {
        public string CustomerCode { get; set; }
        public int TrxNo { get; set; }
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
                                    "   RowNum = ROW_NUMBER() OVER (ORDER BY Imcc2.lineItemNo ASC) " +
                        " from Imcc2 " +
                                    " Where Imcc2.TrxNo='" + request.TrxNo + "' order by LineItemNo";
                    Result = db.Select<Imcc2>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }
    }
}
