class ApiError extends Error {
  constructor(status_code, err_msg, success_val = false) {
    super(err_msg)
    this.status = status_code
    this.success = success_val
  }
}
  
export { ApiError }