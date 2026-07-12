'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentCard } from '@/components/layout/ContentCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { logout } from '@/store/authSlice';
import { Camera, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character');

export default function ProfilePage() {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProfile = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [accessToken]);

  if (isLoading || !profile) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-[1300px] mx-auto space-y-8 pb-10">
      <PageHeader 
        title="Profile Settings" 
        description="Manage your personal account settings and security." 
        breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Profile' }]}
      />

        {/* Section 1: Personal Information */}
        <PersonalInformationSection profile={profile} accessToken={accessToken || ''} onSuccess={setProfile} />

        {/* Section 2: Account Information */}
        <AccountInformationSection profile={profile} />

        {/* Section 3: Change Password */}
        <SecuritySection 
          accessToken={accessToken || ''} 
          onLogout={() => { 
            alert('Password changed successfully. Please login again.'); 
            dispatch(logout()); 
            window.location.href='/login'; 
          }} 
        />

        {/* Section 4: Recent Activity */}
        <ActivitySection accessToken={accessToken || ''} />
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------
// SECTION 1: PERSONAL INFORMATION
// ---------------------------------------------------------
function PersonalInformationSection({ profile, accessToken, onSuccess }: { profile: any, accessToken: string, onSuccess: (data: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
    email: profile.email || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = profile.avatar 
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.avatar}` 
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return alert('First Name, Last Name, and Email are required.');
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile updated successfully');
        onSuccess(data.data);
      } else {
        alert(data.message || 'Error updating profile');
      }
    } catch (err) {
      alert('Server error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2 MB limit.');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid image type. Allowed: JPG, PNG, WEBP.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/avatar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: uploadData
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      } else {
        alert(data.message || 'Error updating avatar');
      }
    } catch (err) {
      alert('Failed to upload avatar');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      }
    } catch (err) {
      alert('Failed to remove avatar');
    }
  };

  return (
    <ContentCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground uppercase">Personal Information</h3>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Avatar Area */}
        <div className="flex flex-col items-center gap-4 min-w-[200px]">
          <div className="relative group rounded-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-muted border-4 border-background shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-xs font-medium">Upload</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png, image/webp"
              onChange={handleAvatarUpload}
            />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[180px]">
              Upload a new avatar.<br />Maximum upload size is 2 MB.
            </p>
            {avatarUrl && (
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleRemoveAvatar}>
                Remove Avatar
              </Button>
            )}
          </div>
        </div>

        {/* Right: Form Area */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" 
                />
              </div>
            </div>
            
            <div className="pt-6 flex justify-center lg:justify-start">
              <Button type="submit" disabled={isSaving} size="lg" className="w-full md:w-auto px-8 py-6 text-base rounded-lg shadow-sm">
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ContentCard>
  );
}

// ---------------------------------------------------------
// SECTION 2: ACCOUNT INFORMATION
// ---------------------------------------------------------
function AccountInformationSection({ profile }: { profile: any }) {
  return (
    <ContentCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground uppercase">Account Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Employee ID</label>
          <p className="font-semibold text-foreground mt-1.5">{profile._id.substring(profile._id.length - 8).toUpperCase()}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Role</label>
          <p className="font-semibold text-foreground mt-1.5">{profile.role.replace('_', ' ')}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Department</label>
          <p className="font-semibold text-foreground mt-1.5">{profile.departmentId?.name || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Account Status</label>
          <div className="mt-1.5">
            <StatusBadge status={profile.status} />
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Email Verification</label>
          <div className="flex items-center gap-1.5 mt-1.5 text-emerald-600 dark:text-emerald-500 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Verified
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Member Since</label>
          <p className="font-semibold text-foreground mt-1.5">{new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Last Login</label>
          <p className="font-semibold text-foreground mt-1.5">
            {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}
          </p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Last Profile Update</label>
          <p className="font-semibold text-foreground mt-1.5">{new Date(profile.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </ContentCard>
  );
}

// ---------------------------------------------------------
// SECTION 3: CHANGE PASSWORD
// ---------------------------------------------------------
function SecuritySection({ accessToken, onLogout }: { accessToken: string, onLogout: () => void }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      return setError('All fields are required.');
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('New password and confirm password do not match.');
    }

    try {
      passwordSchema.parse(formData.newPassword);
    } catch (err: any) {
      return setError(err.errors[0]?.message || 'Weak password.');
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/password`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        onLogout();
      } else {
        setError(data.message || 'Error changing password.');
      }
    } catch (err) {
      setError('Server error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground uppercase">Security</h3>
        <p className="text-sm text-muted-foreground mt-1">Update your account password.</p>
      </div>
      <div className="flex justify-center w-full">
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-lg mt-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-start gap-3 border border-destructive/20">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={formData.currentPassword}
                onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-12 transition-shadow" 
              />
              <button 
                type="button" 
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-12 transition-shadow" 
              />
              <button 
                type="button" 
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-12 transition-shadow" 
              />
              <button 
                type="button" 
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="pt-6 flex justify-center">
            <Button type="submit" disabled={isSaving} size="lg" className="w-full px-8 py-6 text-base rounded-lg shadow-sm">
              {isSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </ContentCard>
  );
}

// ---------------------------------------------------------
// SECTION 4: RECENT ACTIVITY
// ---------------------------------------------------------
function ActivitySection({ accessToken }: { accessToken: string }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/activity?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [page, accessToken]);

  const columns = [
    {
      header: 'Action',
      cell: (row: any) => (
        <span className="font-semibold">{row.action}</span>
      ),
    },
    {
      header: 'Description',
      cell: (row: any) => (
        <span className="text-muted-foreground">{row.description || '-'}</span>
      ),
    },
    {
      header: 'Date',
      cell: (row: any) => new Date(row.createdAt).toLocaleString(),
    },
    {
      header: 'Module',
      cell: (row: any) => (
        <span className="text-xs uppercase bg-muted/80 px-2 py-1 rounded-md tracking-wide">
          {row.module}
        </span>
      ),
    }
  ];

  return (
    <ContentCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground uppercase">Recent Activity</h3>
      </div>
      <div className="mt-2">
        <DataTable 
          data={activities}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No recent activity found."
        />
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </ContentCard>
  );
}