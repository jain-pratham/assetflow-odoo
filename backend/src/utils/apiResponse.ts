export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: any;
  error?: any;
}

export const successResponse = <T>(message: string, data?: T, pagination?: any): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    ...(pagination && { pagination })
  };
};

export const errorResponse = (message: string, error?: any): ApiResponse => {
  return {
    success: false,
    message,
    error,
  };
};
