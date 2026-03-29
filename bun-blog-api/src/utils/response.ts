export class ApiResponse {
    static json(data: any, status: number = 200){
        return new Response(JSON.stringify(data),{
            status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' : 'Content-Type'
            }
        });
    }
}