using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace WebApi.ServiceModel.Tables
{
    public class Saal1
    {
        public string TableName { get; set; }
        public string FieldName { get; set; }
        public string PrimaryKeyName { get; set; }
        public string PrimaryKeyValue { get; set; }
        public int PrimaryKeyLineItemNo { get; set; }
        public int LineItemNo { get; set; }
        public string NewValue { get; set; }
        public string OldValue { get; set; }       
    }
}
