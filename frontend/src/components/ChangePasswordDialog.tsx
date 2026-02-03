import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changePassword } from "@/api/authApi";
import { Lock, Eye, EyeOff } from "lucide-react";

interface ChangePasswordDialogProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
}

export const ChangePasswordDialog = ({ isOpen, token, onClose }: ChangePasswordDialogProps) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword, token);
      setSuccess("Password changed successfully!");
      
      // Reset form and close after 2 seconds
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
        setError("");
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-slate-800">
            Change Password
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 text-green-700 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="text-lg">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-slate-700">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={loading}
                  className="h-12 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-slate-200 hover:bg-slate-400"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-slate-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  disabled={loading}
                  className="h-12 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-slate-200 hover:bg-slate-400"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className=" h-12 border-slate-200/50 bg-white/50 backdrop-blur-sm focus:bg-white/80 transition-all duration-200 rounded-xl pr-12"
                /> 
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-slate-200 hover:bg-slate-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className=" bg-slate-100 flex-1 h-12 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className=" bg-slate-100 flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Changing...
                  </div>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
