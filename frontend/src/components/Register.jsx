import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/api'
import './Auth.css'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer', location: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await registerUser(form)
      setSuccess('Registration successful. You can now sign in.')
      setTimeout(() => navigate('/login'), 900)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="register-title">
        <div className="auth-brand">AgriConnect</div>
        <div className="auth-card">
          <h1 id="register-title">Join AgriConnect</h1>
          <p className="auth-subtitle">Create an account for your role in the farm-to-market network.</p>
          {success && <div className="auth-message" role="status">{success}</div>}
          {error && <div className="auth-message auth-error" role="alert">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              Full Name
              <input name="name" type="text" value={form.name} onChange={updateField} required autoComplete="name" />
            </label>
            <label className="auth-field">
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} required autoComplete="email" />
            </label>
            <label className="auth-field">
              Password
              <input name="password" type="password" value={form.password} onChange={updateField} minLength="8" required autoComplete="new-password" />
            </label>
            <label className="auth-field">
              Location (optional)
              <input name="location" type="text" value={form.location} onChange={updateField} placeholder="e.g. Nagercoil" autoComplete="address-level2" />
            </label>
            <label className="auth-field">
              Role
              <select name="role" value={form.role} onChange={updateField}>
                <option value="farmer">Farmer</option>
                <option value="fpo">FPO</option>
                <option value="buyer">Buyer</option>
              </select>
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          <p className="auth-footer">Already registered? <Link to="/login">Login</Link></p>
        </div>
      </section>
    </main>
  )
}

export default Register