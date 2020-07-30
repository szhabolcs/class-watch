function searchStudentByName(array, studentName){
    for(let i in array){
        if(array[i].name===studentName)
            return i;
    }
}

module.exports={searchStudentByName};