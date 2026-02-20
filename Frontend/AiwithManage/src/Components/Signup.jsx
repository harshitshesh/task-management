import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'

const Signup = () => {
    const [formdata, setformdata] = useState([{
        name: "", email: "", password: ""
    }])
    const [mydata, setdata] = useState(null)


    function handlechage(e) {


        setformdata({ ...formdata, [e.target.name]: e.target.value })
    }

    async function submitdata(e) {
        e.preventDefault();
        try {
            let res = await fetch("http://localhost:5000/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formdata) })
            let data = await res.json();
            setdata(data)
            alert("Signup successfully")

        } catch (err) {
            console.log(err)
        }





    }

    return (
        <div>
            <div className="formcontainer" >
                <form onSubmit={submitdata}>

                    <input onChange={handlechage} value={formdata.name} name='name' type="name" />
                    <input onChange={handlechage} value={formdata.email} name='email' type="email" />
                    <input onChange={handlechage} value={formdata.password} name='password' type="password" />
                    <button type='submit' >Submit</button>
                </form>
            </div>
        </div>
    )
}

export default Signup
