import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const VendorRegisterPage: React.FC = () => {
  useDocumentTitle('Become a Vendor — LaserHub');
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shop_name: '',
    email: '',
    location: '',
    description: '',
    website: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shop_name.trim() || !form.email.trim()) {
      toast.error('Shop name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/vendors/register', form);
      toast.success('Registration submitted! We will review your application.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vendor-register-page">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to Marketplace</Link>

      <div className="vendor-register-card">
        <div className="vendor-register-header">
          <Store size={32} />
          <h1>Become a Vendor</h1>
          <p>Join our marketplace and connect with customers looking for laser cutting services.</p>
        </div>

        <form onSubmit={handleSubmit} className="vendor-register-form">
          <div className="form-group">
            <label htmlFor="shop_name">Shop Name *</label>
            <input
              id="shop_name"
              name="shop_name"
              type="text"
              value={form.shop_name}
              onChange={handleChange}
              placeholder="Your business name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Business Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="contact@yourshop.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              value={form.location}
              onChange={handleChange}
              placeholder="City, Country"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
              placeholder="https://yourshop.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell us about your shop, capabilities, and specialties..."
              rows={4}
            />
          </div>

          <button type="submit" className="vendor-register-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};
