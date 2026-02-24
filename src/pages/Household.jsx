import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Household } from '@/entities/Household';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Shield, Trash2, Users, Settings, UserPlus } from 'lucide-react';
import LoadingSpinner from '@/components/budget/LoadingSpinner';
import LoggedOutState from '@/components/budget/LoggedOutState';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const JoinHouseholdDialog = ({ onJoin }) => {
  const [householdId, setHouseholdId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!householdId.trim()) return;
    setIsLoading(true);
    try {
      await onJoin(householdId.trim());
    } catch (error) {
       // Error is handled by the parent
    }
    setIsLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">הצטרף למשק בית קיים</Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הצטרפות למשק בית קיים</DialogTitle>
          <DialogDescription>
            הזן את קוד ההצטרפות שקיבלת ממנהל משק הבית. הצטרפות תעביר לארכיון את הנתונים האישיים הנוכחיים שלך.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label htmlFor="join-id">קוד הצטרפות</Label>
          <Input
            id="join-id"
            value={householdId}
            onChange={(e) => setHouseholdId(e.target.value)}
            placeholder="הדבק כאן את קוד ההצטרפות"
          />
        </div>
        <DialogFooter>
          <Button 
            onClick={handleJoin} 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "מצטרף..." : "הצטרף ועדכן נתונים"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function HouseholdPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [householdData, setHouseholdData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isPersonalSpace, setIsPersonalSpace] = useState(false);

  useEffect(() => {
    const fetchUserAndMembers = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        if (user && user.householdId) {
          const [householdMembers, fetchedHouseholdData] = await Promise.all([
            User.filter({ householdId: user.householdId }),
            Household.get(user.householdId)
          ]);
          setMembers(householdMembers);
          setHouseholdData(fetchedHouseholdData);
          setIsPersonalSpace(householdMembers.length === 1);
        }
      } catch (e) {
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    fetchUserAndMembers();
  }, []);
  
  const refetchData = async () => {
    setIsLoading(true);
    try {
        const user = await User.me();
        setCurrentUser(user);
        if (user && user.householdId) {
          const [householdMembers, fetchedHouseholdData] = await Promise.all([
            User.filter({ householdId: user.householdId }),
            Household.get(user.householdId)
          ]);
          setMembers(householdMembers);
          setHouseholdData(fetchedHouseholdData);
          setIsPersonalSpace(householdMembers.length === 1);
        }
    } catch(e) {
        console.error("Failed to refetch data", e);
    }
    setIsLoading(false);
  }

  const copyHouseholdId = () => {
    if (currentUser && currentUser.householdId) {
      navigator.clipboard.writeText(currentUser.householdId);
      alert('קוד ההזמנה למשק הבית הועתק!');
    }
  };

  const addMemberByEmail = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    
    setIsAddingMember(true);
    try {
      // Use RPC to find user by email (bypasses RLS safely)
      const existingUsers = await User.findByEmail(newMemberEmail.trim());
      if (existingUsers.length === 0) {
        alert('משתמש עם המייל הזה לא נמצא. המשתמש צריך להתחבר לפחות פעם אחת לאפליקציה.');
        setIsAddingMember(false);
        return;
      }
      
      const userToAdd = existingUsers[0];
      if (userToAdd.householdId && userToAdd.householdId !== currentUser.householdId) {
        alert('המשתמש כבר שייך למשק בית אחר.');
        setIsAddingMember(false);
        return;
      }
      if (userToAdd.householdId === currentUser.householdId) {
        alert('המשתמש כבר חבר במשק הבית.');
        setIsAddingMember(false);
        return;
      }
      
      // Use adminUpdate RPC to update another user's profile
      await User.adminUpdate(userToAdd.id, { 
        householdId: currentUser.householdId,
        role: 'member'
      });
      
      setNewMemberEmail('');
      refetchData();
      alert('המשתמש נוסף בהצלחה למשק הבית!');
    } catch (error) {
      console.error("Failed to add member:", error);
      alert('שגיאה בהוספת המשתמש.');
    }
    setIsAddingMember(false);
  };

  const removeMember = async (memberId) => {
    if (confirm('האם אתה בטוח שברצונך להסיר את המשתמש ממשק הבית?')) {
      try {
        const removedUser = members.find(m => m.id === memberId);
        // Create a new personal household for the removed user
        const personalHousehold = await Household.create({ 
          name: `${removedUser.full_name}'s Personal Space`, 
          resetDay: 1 
        });
        // Use adminUpdate RPC (bypasses RLS for cross-user update)
        await User.adminUpdate(memberId, { 
          householdId: personalHousehold.id, 
          role: 'admin' 
        });
        refetchData();
      } catch (error) {
        console.error("Failed to remove member:", error);
        alert('שגיאה בהסרת המשתמש.');
      }
    }
  };

  const changeRole = async (memberId, newRole) => {
    try {
      // Use adminUpdate RPC (bypasses RLS for cross-user update)
      await User.adminUpdate(memberId, { role: newRole });
      refetchData();
    } catch (error) {
      console.error("Failed to change role:", error);
      alert('שגיאה בשינוי ההרשאה.');
    }
  }
  
  const handleResetDayChange = async (newDay) => {
    if (!householdData || !currentUser || currentUser.role !== 'admin') {
        alert("אין לך הרשאה לבצע פעולה זו.");
        return;
    };
    try {
        const day = parseInt(newDay, 10);
        await Household.update(householdData.id, { resetDay: day });
        setHouseholdData(prev => ({...prev, resetDay: day}));
        alert('תאריך האיפוס עודכן!');
    } catch (error) {
        console.error("Failed to update reset day:", error);
        alert('שגיאה בעדכון תאריך האיפוס.');
    }
  };

  const handleJoinHousehold = async (joinId) => {
    try {
        const existingHousehold = await Household.get(joinId);
        if (!existingHousehold) {
            alert("קוד משק בית לא תקין או לא קיים.");
            throw new Error("Invalid household ID");
        }
        // Self-update: user joins a household themselves (RLS allows auth.uid() = id)
        await User.updateMyUserData({ 
            householdId: joinId,
            role: 'member'
        });
        window.location.reload();
    } catch (error) {
        console.error("Error joining household:", error);
        alert("שגיאה בהצטרפות למשק הבית. ודא שהקוד נכון ונסה שוב.");
        throw error;
    }
  };


  if (isLoading) return <LoadingSpinner />;
  if (!currentUser) return <LoggedOutState />;

  const isCurrentUserAdmin = currentUser.role === 'admin';
  const resetDays = Array.from({ length: 28 }, (_, i) => i + 1);

  if (isPersonalSpace) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pt-24" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">ניהול המרחב שלך</h1>
                    <p className="text-slate-600">אתה כרגע במרחב אישי. מכאן תוכל להזמין חברים או להצטרף למשק בית קיים.</p>
                </div>
                <Alert className="mb-8 bg-yellow-50 border-yellow-200">
                    <Users className="h-4 w-4 text-yellow-700" />
                    <AlertTitle className="text-yellow-800">מרחב אישי</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        כל הנתונים שאתה יוצר שמורים רק לך. כדי לשתף תקציב, הזמן חברים או הצטרף למשק בית.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>הזמן חברים</CardTitle>
                            <CardDescription>הפוך את המרחב האישי שלך למשק בית משותף על ידי הזמנת חברים.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button onClick={copyHouseholdId} className="w-full">
                                <Copy className="w-4 h-4 ml-2"/>
                                העתק קוד הזמנה
                           </Button>
                           <p className="text-xs text-slate-500 mt-2">שתף את הקוד כדי שאחרים יוכלו להצטרף.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>הצטרף למשק בית</CardTitle>
                            <CardDescription>אם הוזמנת למשק בית אחר, הזן את הקוד כדי להצטרף.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <JoinHouseholdDialog onJoin={handleJoinHousehold} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      )
  }

  // Standard household management UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pt-24" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">ניהול משק בית</h1>
          <p className="text-slate-600">נהל את החברים, ההרשאות והגדרות משק הבית שלך</p>
        </div>

        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Users className="w-5 h-5"/>
              הזמן חברים חדשים
            </CardTitle>
            <CardDescription>
              שתף את הקוד הבא עם בן/בת הזוג או חברים כדי שיצטרפו למשק הבית.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <Input
              readOnly
              value={currentUser.householdId}
              className="font-mono text-center bg-white"
            />
            <Button onClick={copyHouseholdId} variant="outline" className="bg-white hover:bg-slate-50">
              <Copy className="w-4 h-4 ml-2"/>
              העתק קוד
            </Button>
          </CardContent>
        </Card>

        {isCurrentUserAdmin && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <UserPlus className="w-5 h-5"/>
                הוסף חבר ידנית
              </CardTitle>
              <CardDescription>
                הזן את כתובת המייל של המשתמש שברצונך להוסיף למשק הבית.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addMemberByEmail} className="flex gap-4">
                <Input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="flex-1 bg-white"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isAddingMember}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAddingMember ? 'מוסיף...' : 'הוסף חבר'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isCurrentUserAdmin && householdData && (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Settings className="w-5 h-5"/>
                        הגדרות משק בית
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-xs">
                        <Label htmlFor="reset-day">תאריך איפוס חודשי</Label>
                        <Select
                            value={householdData.resetDay?.toString() || '1'}
                            onValueChange={handleResetDayChange}
                        >
                            <SelectTrigger id="reset-day">
                                <SelectValue placeholder="בחר יום..." />
                            </SelectTrigger>
                            <SelectContent>
                                {resetDays.map(day => (
                                    <SelectItem key={day} value={day.toString()}>
                                        {day} לחודש
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <CardDescription className="mt-2">
                            ביום זה, הנתונים יאורכבו והתקציב יתאפס לברירות המחדל.
                        </CardDescription>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>חברים במשק הבית</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map(member => (
                <div key={member.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.full_name ? member.full_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{member.full_name}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrentUserAdmin && member.id !== currentUser.id ? (
                      <>
                        <Select value={member.role} onValueChange={(newRole) => changeRole(member.id, newRole)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="בחר הרשאה" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">מנהל</SelectItem>
                            <SelectItem value="member">חבר</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => removeMember(member.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </>
                    ) : (
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {member.role === 'admin' ? 'מנהל' : 'חבר'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}