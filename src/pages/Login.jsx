
function Login(){
    return(
        <>
        <div className= "min-h-screen flex items-center justify-center">
            <div className="login-container bg-white p-8 shadow-md w-full max-w-md">
                <h1>Login Page</h1>
                <form>
                    <label>
                        Username:
                        <input type="text" name="username" />
                    </label>
                    <br />
                    <label>
                        Password:
                        <input type="password" name="password" />
                    </label>
                    <br />
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
        </>
    )
}

export default Login;