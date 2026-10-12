export function sendSuccess(res, data=null, message = 'Success', statusCode =200){
    return res.status(statusCode).json({
        success:true,
        success:true,
        message,
        data,
    });
}

export function sendCreated(res, data, message='Created successfully'){
    return sendSuccess(res, data, message,201);
}

export function sendPagination(res, data, pagination){
    return res.status(200).json({
        data,
        pagination:{
            page:pagination.page,
            limit:pagination.limit,
            total:pagination.total,
            totalPages:Math.ceil(pagination.total / pagination.limit),
            hasNextPage:pagination.page < Math.ceil(pagination.total / pagination.limit),
            hasPrevPage:pagination.page>1,
        },
    });
}