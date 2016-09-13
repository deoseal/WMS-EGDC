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
    [Route("/wms/saal/create", "Get")]				//impr1?ProductCode= &BarCode=
    public class Saal : IReturn<CommonResponse>
    {
        public string TableName { get; set; }
        public string FieldName { get; set; }
        public string PrimaryKeyName { get; set; }
        public string PrimaryKeyValue { get; set; }
        public int PrimaryKeyLineItemNo { get; set; }
        public int LineItemNo { get; set; }
        public string NewValue { get; set; }
        public string OldValue { get; set; }
        public string QtyStatus { get; set; }
    }
    public class Saal_Logic
    {
        public IDbConnectionFactory DbConnectionFactory { get; set; }

        public int Update_Saal(Saal request)
        {
            int Result = -1;
            int intResult = -1;
            try
            {
                using (var db = DbConnectionFactory.OpenDbConnection("WMS"))
                {
                    if (request.PrimaryKeyLineItemNo > 0)
                    {
                        intResult = db.Scalar<int>(
                                             "Select Max(lineItemNo) from saal1 where Tablename = {0} AND PrimaryKeyName = {1} AND PrimaryKeyValue = {2} and PrimaryKeyLineItemNo = {3}",
                                            request.TableName, request.PrimaryKeyName, request.PrimaryKeyValue, request.PrimaryKeyLineItemNo
                             );
                        if (request.TableName == "Imgr2" || request.TableName == "Imgi2")
                        {
                            db.ExecuteSql("Update " + request.TableName + " Set " + request.FieldName +
                                " = " + Modfunction.SQLSafeValue(request.NewValue) + " Where TrxNo = " + 
                                Modfunction.SQLSafeValue(request.PrimaryKeyValue) + " AND LineItemNo = " + 
                                Modfunction.SQLSafeValue(request.PrimaryKeyLineItemNo.ToString()));

                        }
                    }
                    else
                    {
                        intResult = db.Scalar<int>(
                                             "Select Max(lineItemNo) from saal1 where Tablename = {0} AND PrimaryKeyName = {1} AND PrimaryKeyValue = {2} ",
                                            request.TableName, request.PrimaryKeyName, request.PrimaryKeyValue
                             );
                    }                   
                    if (intResult > 0)
                    { intResult = intResult + 1; }
                    else
                    { intResult = 1; }
                    if (request.PrimaryKeyLineItemNo > 0)
                    {
                        db.ExecuteSql("insert into saal1 (Tablename, PrimaryKeyName, PrimaryKeyValue,PrimaryKeyLineItemNo ,LineItemNo, FieldName, NewValue, OldValue) values ('" +
                     Modfunction.SQLSafe(request.TableName) + "','" + Modfunction.SQLSafe(request.PrimaryKeyName)+ "'," + Modfunction.SQLSafeValue(request.PrimaryKeyValue) + "," + Modfunction.SQLSafeValue(request.PrimaryKeyLineItemNo.ToString()) + "," + intResult.ToString() + ",'" +
                      Modfunction.SQLSafe(request.FieldName) + "'," + Modfunction.SQLSafeValue(request.NewValue) + "," + Modfunction.SQLSafeValue(request.OldValue) + ")");
                    }
                    else
                    {
                        db.ExecuteSql("insert into saal1 (Tablename, PrimaryKeyName, PrimaryKeyValue,PrimaryKeyLineItemNo ,LineItemNo, FieldName, NewValue, OldValue) values ('" +
                        Modfunction.SQLSafe(request.TableName) + "','" + Modfunction.SQLSafe(request.PrimaryKeyName) + "'," + Modfunction.SQLSafeValue(request.PrimaryKeyValue) + "," + Modfunction.SQLSafeValue(request.PrimaryKeyLineItemNo.ToString()) + "," + intResult.ToString() + ",'" +
                        Modfunction.SQLSafe(request.FieldName) + "'," + Modfunction.SQLSafeValue(request.NewValue) + "," + Modfunction.SQLSafeValue(request.OldValue) + ")");
                    }

                }
            }
            catch { throw; }
            return Result;
        }
    }
}
