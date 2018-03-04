using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace WebApi.ServiceModel.Tables
{
    public class Impm1
    {
        public string DimensionFlag { get; set; }
        public string StoreNo { get; set; }
        public string WarehouseCode { get; set; }
        public int ProductTrxNo { get; set; }
        public decimal Volume { get; set; }
        public decimal Weight { get; set; }
        public decimal SpaceArea { get; set; }
        public decimal UnitVol { get; set; }
        public decimal UnitWt { get; set; }
        public int BalanceLooseQty { get; set; }
        public int BalancePackingQty { get; set; }
        public int BalanceWholeQty { get; set; }
        public int PackingPackageSize{ get; set; }
        public int WholePackageSize { get; set; }
        public int BatchLineItemNo { get; set; }
        public string BatchNo { get; set; }
        public string Description { get; set; }
        public string ProductCode { get; set; }
        public string RefNo { get; set; }
        public int LooseQty { get; set; }
        public int PackingQty { get; set; }
        public int WholeQty { get; set; }
        public string UpdateBy { get; set; }
        public string CustomerCode { get; set; }

        
    }
}
