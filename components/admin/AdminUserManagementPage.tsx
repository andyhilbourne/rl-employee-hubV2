import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import { UsersIcon, XMarkIcon } from '../icons';

const ADD_NEW_ROLE_VALUE = "-- Add New Role --";

export const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Field Worker');
  const [customRoleName, setCustomRoleName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleResetPassword = async (email: string) => {
    if (window.confirm(`Are you sure you want to send a password reset email to ${email}?`)) {
        setIsSubmitting(true);
        setSubmitMessage(null);
        try {
            await userService.sendPasswordResetEmail(email);
            setSubmitMessage({ type: 'success', text: `Password reset email sent to ${email}.`});
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send password reset email.';
            setSubmitMessage({ type: 'error', text: message });
        } finally {
            setIsSubmitting(false);
        }
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    let roleToSave = selectedRole;
    if (selectedRole === ADD_NEW_ROLE_VALUE) {
      if (!customRoleName.trim()) {
        setSubmitMessage({ type: 'error', text: 'Please enter a name for the custom role.'});
        setIsSubmitting(false);
        return;
      }
      roleToSave = customRoleName.trim();
    }

    try {
      await userService.createUser({ email: newUserEmail, name: newUserName, role: roleToSave }, newUserPassword);
      setSubmitMessage({ type: 'success', text: `User "${newUserName}" created successfully.` });
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setSelectedRole('Field Worker');
      setCustomRoleName('');
      fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user.';
      setSubmitMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleToggleUserStatus = async (user: User) => {
    const action = user.disabled ? "enable" : "disable";
    if (window.confirm(`Are you sure you want to ${action} the user "${user.name}"?`)) {
      setIsSubmitting(true);
      setSubmitMessage(null);
      try {
        await userService.toggleUserStatus(user.id, !user.disabled);
        setSubmitMessage({ type: 'success', text: `User "${user.name}" has been ${action}d.` });
        await fetchUsers();
      } catch (err) {
        setSubmitMessage({ type: 'error', text: err instanceof Error ? err.message : `An unknown error occurred.`});
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 mb-6 pb-2 border-b-2 border-teal-500">
        <UsersIcon className="w-8 h-8 mr-3 text-teal-600" />
        <h2 className="text-3xl font-bold">User Management</h2>
      </div>
      
      {submitMessage && <p className={`text-sm p-3 rounded-md ${submitMessage.type === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>{submitMessage.text}</p>}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Create New User</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="newUserName" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required className="mt-1 block w-full" />
            </div>
            <div>
                <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" id="newUserEmail" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required className="mt-1 block w-full" />
            </div>
             <div>
                <label htmlFor="newUserPassword">Initial Password</label>
                <input type="password" id="newUserPassword" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required className="mt-1 block w-full" />
            </div>
             <div>
                <label htmlFor="newRole" className="block text-sm font-medium text-gray-700">Role</label>
                <select 
                id="newRole" 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)} 
                className="mt-1 block w-full"
                >
                <option value="Field Worker">Field Worker</option>
                <option value="Foreman">Foreman</option>
                <option value="Admin">Admin</option>
                <option value={ADD_NEW_ROLE_VALUE}>-- Add New Role --</option>
                </select>
            </div>
          </div>
         
          {selectedRole === ADD_NEW_ROLE_VALUE && (
            <div>
              <label htmlFor="customRoleName" className="block text-sm font-medium text-gray-700">Custom Role Name</label>
              <input 
                type="text" 
                id="customRoleName" 
                value={customRoleName} 
                onChange={(e) => setCustomRoleName(e.target.value)} 
                required 
                placeholder="Enter new role name"
                className="mt-1 block w-full"
              />
            </div>
          )}
          <Button type="submit" isLoading={isSubmitting} variant="primary">Create User</Button>
        </form>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <h3 className="text-xl font-semibold p-4 border-b text-gray-700">Existing Users</h3>
        {users.length === 0 && !error ? (
          <p className="p-4 text-gray-500">No users found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className={user.disabled ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ user.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800' }`}>
                            {user.disabled ? 'Disabled' : 'Active'}
                        </span>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button onClick={() => handleResetPassword(user.email)} variant="ghost" size="sm" disabled={isSubmitting}>Reset Password</Button>
                    <Button 
                      onClick={() => handleToggleUserStatus(user)} 
                      variant={user.disabled ? 'primary' : 'danger'}
                      size="sm"
                      disabled={user.email === 'andyhilbourne@example.com' || isSubmitting}
                      title={user.email === 'andyhilbourne@example.com' ? 'Cannot disable the primary admin' : (user.disabled ? 'Enable user' : 'Disable user')}
                    >
                      {user.disabled ? 'Enable' : 'Disable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};