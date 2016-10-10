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
    [Route("/wms/impr1", "Get")]				//impr1?ProductCode= &BarCode=
    public class Impr : IReturn<CommonResponse>
    {
        public string ProductCode { get; set; }
        public string BarCode { get; set; }
    }
    public class Impr_Logic
    {
        public IDbConnectionFactory DbConnectionFactory { get; set; }
        public object Get_Impr1(Impr request)
        {
            object Result = null;
            try
            {
                if (!string.IsNullOrEmpty(request.ProductCode))
                {
                    Result = Get_Impr1_List(request);
                }
                else
                {
                    Result = Get_Impr1_Single(request);
                }
            }
            catch { throw; }
            return Result;
        }
        public Impr1 Get_Impr1_Single(Impr request)
        {
            Impr1 Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    List<Impa1> impa1 = db.Select<Impa1>("Select * from Impa1");
                    string strBarCodeFiled = impa1[0].BarCodeField;
                    string[] strBarCodeList = strBarCodeFiled.Split(',');
                    if (strBarCodeList.Length <= 1)
                    {
                        string strSql = "Select * From Impr1 Where IsNull(ProductCode,'')<>'' And IsNull(StatusCode,'')<>'DEL' And " + strBarCodeFiled + "='" + Modfunction.SQLSafe(request.BarCode) + "'";
                        Result = db.QuerySingle<Impr1>(strSql);
                    }
                    else
                    {
                        string strBarCodeFilter = "";
                            for (int i = 0; i < strBarCodeList.Length; i++)
                        {
                            if (strBarCodeFilter == "")
                            {
                                strBarCodeFilter = strBarCodeList[i] + "='" + Modfunction.SQLSafe(request.BarCode) + "'";
                            }
                            else
                            {
                                strBarCodeFilter = strBarCodeFilter + " OR " + strBarCodeList[i] + "='" + Modfunction.SQLSafe(request.BarCode) + "'";
                            }
                        }
                        if (strBarCodeFilter != "")
                        {
                            string strSql = "Select * From Impr1 Where IsNull(ProductCode,'')<>'' And IsNull(StatusCode,'')<>'DEL' And (" + strBarCodeFilter + ")";
                            Result = db.QuerySingle<Impr1>(strSql);
                        }
                        else
                        {
                            string strSql = "Select top 0 * From Impr1 ";
                            Result = db.QuerySingle<Impr1>(strSql);
                        }
                    }
                }
            }
            catch { throw; }
            return Result;
        }
        public List<Impr1> Get_Impr1_List(Impr request)
        {
            List<Impr1> Result = null;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {

                    string strSql = "Select Top 10 " +
                                    "Impr1.TrxNo, IsNull(Impr1.ProductCode,'') AS ProductCode," +
                                    "IsNull(Impr1.ProductName,'') AS ProductName, IsNull(Impr1.SerialNoFlag,'') AS SerialNoFlag," +
                                    "IsNull(Impr1.UserDefine01,'') AS UserDefine01, Impr1.StatusCode " +
                                    "From Impr1 Where IsNull(Impr1.StatusCode,'')='USE' And IsNull(Impr1.ProductCode,'') LIKE '" + request.ProductCode + "%' " +
                                    "Order By ProductCode ASC";
                    Result = db.Select<Impr1>(strSql);
                }
            }
            catch { throw; }
            return Result;
        }
    }
}
