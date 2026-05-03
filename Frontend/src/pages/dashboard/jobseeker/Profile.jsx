import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/jobsApi';
import { useAuth } from '../../../context/AuthContext';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Award, 
  Save,
  Plus,
  X
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [profileData, setProfileData] = React.useState({
    name: user?.name || '',
    careerProfile: {
      field: user?.careerProfile?.field || 'other',
      location: user?.careerProfile?.location || '',
      seniority: user?.careerProfile?.seniority || 'any',
      remotePreference: user?.careerProfile?.remotePreference || 'any',
      skills: user?.careerProfile?.skills || [],
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/me/career-profile', profileData.careerProfile);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const skill = e.target.value.trim();
      if (!profileData.careerProfile.skills.includes(skill)) {
        setProfileData({
          ...profileData,
          careerProfile: {
            ...profileData.careerProfile,
            skills: [...profileData.careerProfile.skills, skill]
          }
        });
      }
      e.target.value = '';
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      careerProfile: {
        ...profileData.careerProfile,
        skills: profileData.careerProfile.skills.filter(s => s !== skillToRemove)
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Your Profile</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your career profile and personal details.</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} className="flex items-center space-x-2">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-xl">
              {user?.name?.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
            <div className="inline-flex px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
              {user?.role}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-primary" />
              Career Preferences
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Current Location</label>
                <Input 
                  placeholder="e.g. Karachi, Pakistan"
                  value={profileData.careerProfile.location}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    careerProfile: { ...profileData.careerProfile, location: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Seniority Level</label>
                <select 
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
                  value={profileData.careerProfile.seniority}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    careerProfile: { ...profileData.careerProfile, seniority: e.target.value }
                  })}
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Principal</option>
                  <option value="any">Any Level</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Work Style</label>
                <select 
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
                  value={profileData.careerProfile.remotePreference}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    careerProfile: { ...profileData.careerProfile, remotePreference: e.target.value }
                  })}
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote-first</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="any">Any Style</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              Skills & Expertise
            </h3>
            
            <div className="space-y-4">
              <Input 
                placeholder="Type a skill and press Enter..."
                onKeyDown={addSkill}
              />
              <div className="flex flex-wrap gap-2">
                {profileData.careerProfile.skills.map((skill, i) => (
                  <span 
                    key={i} 
                    className="flex items-center px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-100 dark:border-gray-700 text-sm font-medium group"
                  >
                    {skill}
                    <button 
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {profileData.careerProfile.skills.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No skills added yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
