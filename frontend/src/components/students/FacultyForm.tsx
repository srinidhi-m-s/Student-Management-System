import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { useAuth } from '../../context/useAuth';

const API_URL = 'http://localhost:4000';

export interface FacultyFormProps {
  faculty?: { _id?: string; name: string; email: string; password?: string };
  onSuccess: () => void;
}

const FacultyForm = ({ faculty, onSuccess }: FacultyFormProps) => {
  const { token } = useAuth();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: faculty ? { name: faculty.name, email: faculty.email, password: '' } : { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: { name: string; email: string; password?: string }) => {
    try {
      if (faculty && faculty._id) {
        // Update existing faculty
        const res = await fetch(`${API_URL}/faculty/${faculty._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update faculty');
      } else {
        // Add new faculty
        const res = await fetch(`${API_URL}/faculty`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to add faculty');
      }
      onSuccess();
      reset();
    } catch (err) {
      console.error('Failed to add/update faculty:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input {...register('name', { required: true })} className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input {...register('email', { required: true })} type="email" className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input {...register('password', { required: !faculty })} type="password" className="w-full px-3 py-2 border rounded-md" />
      </div>
      <Button type="submit" variant="default">
        {faculty ? 'Update' : 'Add'} Faculty
      </Button>
    </form>
  );
};

export { FacultyForm };
