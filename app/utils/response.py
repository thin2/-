from typing import Any
from flask import jsonify


class Response:
    """统一响应格式类"""
    
    @staticmethod
    def success(data: Any = None, message: str = "操作成功") -> Any:
        """成功响应
        
        Args:
            data: 响应数据
            message: 响应消息
            
        Returns:
            Flask响应对象
        """
        response_data = {
            "code": 0,
            "message": message,
            "data": data
        }
        return jsonify(response_data)
    
    @staticmethod
    def error(message: str = "操作失败", code: int = 1, data: Any = None, status_code: int = 200) -> Any:
        """错误响应
        
        Args:
            code: 错误码
            message: 错误消息
            data: 响应数据
            status_code: HTTP状态码
            
        Returns:
            Flask响应对象
        """
        response_data = {
            "code": code,
            "message": message,
            "data": data
        }
        return jsonify(response_data), status_code
    
    @staticmethod
    def bad_request(message: str = "请求参数错误", data: Any = None) -> Any:
        """400错误 - 请求参数错误
        
        Args:
            message: 错误消息
            data: 响应数据
            
        Returns:
            Flask响应对象
        """
        return Response.error(code=400, message=message, data=data, status_code=400)
    
    @staticmethod
    def unauthorized(message: str = "未授权访问", data: Any = None) -> Any:
        """401错误 - 未授权访问
        
        Args:
            message: 错误消息
            data: 响应数据
            
        Returns:
            Flask响应对象
        """
        return Response.error(code=401, message=message, data=data, status_code=401)
    
    @staticmethod
    def forbidden(message: str = "禁止访问", data: Any = None) -> Any:
        """403错误 - 禁止访问
        
        Args:
            message: 错误消息
            data: 响应数据
            
        Returns:
            Flask响应对象
        """
        return Response.error(code=403, message=message, data=data, status_code=403)
    
    @staticmethod
    def not_found(message: str = "资源不存在", data: Any = None) -> Any:
        """404错误 - 资源不存在
        
        Args:
            message: 错误消息
            data: 响应数据
            
        Returns:
            Flask响应对象
        """
        return Response.error(code=404, message=message, data=data, status_code=404)
    
    @staticmethod
    def conflict(message: str = "资源冲突", data: Any = None) -> Any:
        """409错误 - 资源冲突
        
        Args:
            message: 错误消息
            data: 响应数据
            
        Returns:
            Flask响应对象
        """
        return Response.error(code=409, message=message, data=data, status_code=409)
    
    @staticmethod
    def internal_server_error(message: str = "服务器内部错误", data: Any = None) -> Any:
        """500错误 - 服务器内部错误
        
        Args:
            message: 错误消息
            data: 响应数据
            
        Returns:
            Flask响应对象
        """
        return Response.error(code=500, message=message, data=data, status_code=500)
