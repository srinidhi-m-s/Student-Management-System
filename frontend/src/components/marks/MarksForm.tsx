import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useAddMarks, useUpdateMarks } from '../../hooks/useMarks';
import type { Mark, AddMarkData } from '../../api/marksApi';

interface MarksFormProps {
  mark?: Mark | null;
  studentId?: string;
  subject?: string;
  examType?: string;
  onSuccess: () => void;
}

interface FormData {
  examDate: string;
  maxMarks: number;
  marksObtained: number;
  // remarks field removed
}

export const MarksForm = ({ mark, studentId, subject, examType, onSuccess }: MarksFormProps) => {
  const addMarksMutation = useAddMarks();
  const updateMarksMutation = useUpdateMarks();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    defaultValues: {
      examDate: new Date().toISOString().split('T')[0],
      maxMarks: 100,
      marksObtained: 0,
    }
  });

 
  const maxMarks = watch('maxMarks');

  useEffect(() => {
    if (mark) {
      setValue('examDate', new Date(mark.examDate).toISOString().split('T')[0]);
      setValue('maxMarks', mark.maxMarks);
      setValue('marksObtained', mark.marksObtained);
    } else {
      reset();
    }
  }, [mark, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mark) {
        // Update existing mark
        await updateMarksMutation.mutateAsync({
          markId: mark._id,
          data: {
            maxMarks: Number(data.maxMarks),
            marksObtained: Number(data.marksObtained),
            examDate: data.examDate,
          }
        });
      } else {
        // Add new mark - use props for studentId, subject, examType
        if (!studentId || !subject || !examType) {
          console.error('Missing required fields: studentId, subject, or examType');
          return;
        }
        const addData: AddMarkData = {
          studentId,
          subject,
          examType,
          maxMarks: Number(data.maxMarks),
          marksObtained: Number(data.marksObtained),
          examDate: data.examDate,
        };
        await addMarksMutation.mutateAsync(addData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save marks:', error);
    }
  };

  const isLoading = addMarksMutation.isPending || updateMarksMutation.isPending;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="examDate">Exam Date *</Label>
              <Input
                id="examDate"
                type="date"
                {...register('examDate', { 
                  required: 'Exam date is required' 
                })}
                className="mt-1"
              />
              {errors.examDate && (
                <p className="text-red-600 text-sm mt-1">{errors.examDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxMarks">Maximum Marks *</Label>
              <Input
                id="maxMarks"
                type="number"
                min="1"
                max="1000"
                {...register('maxMarks', { 
                  required: 'Maximum marks is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Maximum marks must be at least 1' },
                  max: { value: 1000, message: 'Maximum marks cannot exceed 1000' }
                })}
                className="mt-1"
              />
              {errors.maxMarks && (
                <p className="text-red-600 text-sm mt-1">{errors.maxMarks.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="marksObtained">Marks Obtained *</Label>
            <Input
              id="marksObtained"
              type="number"
              min="0"
              max={maxMarks || 100}
              {...register('marksObtained', { 
                required: 'Marks obtained is required',
                valueAsNumber: true,
                min: { value: 0, message: 'Marks obtained cannot be negative' },
                validate: (value) => {
                  const max = Number(maxMarks) || 100;
                  if (Number(value) > max) {
                    return `Marks obtained cannot be greater than maximum marks (${max})`;
                  }
                  return true;
                }
              })}
              className="mt-1"
            />
            {errors.marksObtained && (
              <p className="text-red-600 text-sm mt-1">{errors.marksObtained.message}</p>
            )}
          </div>

          {/* Remarks field removed */}

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : (mark ? 'Update Marks' : 'Add Marks')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};