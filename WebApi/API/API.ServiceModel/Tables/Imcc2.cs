using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace WebApi.ServiceModel.Tables
{
     public  class Imcc2
    {
        public int RowNum { get; set; }
        public int TrxNo { get; set; }
        public int LineItemNo { get; set; }
        public string WarehouseCode { get; set; }
        public string StoreNo { get; set; }
        public int ProductTrxNo { get; set; }
        public string CustomerCode { get; set; }
        public string Description { get; set; }
        public string PackingQtyTempValue { get; set; }
        public string WholeQtyTempValue { get; set; }
        public string LooseQtyTempValue { get; set; }
        public string DimensionFlag { get; set; }
        public string PackingUomCode { get; set; }
        public string LooseUomCode { get; set; }
        public string WholeUomCode { get; set; }      
        public string ProductCode { get; set; }

    }
}
