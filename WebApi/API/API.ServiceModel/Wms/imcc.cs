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
    [Route("/wms/imcc1", "Get")]
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
                                            i => i.CustomerCode != null && i.CustomerCode != ""  && i.TrxNo == request.TrxNo
                            ).OrderByDescending(i => i.CycleCountDateTime).ToList<Imcc1>();
                        
                      
                    }

                }
            }
            catch { throw; }
            return Result;
        }
    }
}
