import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageProps } from '@/types';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">
                    Manage your account information.
                </p>
            </div>

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg border bg-card p-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => <DashboardLayout title="Profile">{page}</DashboardLayout>

export default Edit;
