import { actions } from 'astro:actions';
import { withState } from '@astrojs/react/actions';
import { useActionState, useEffect } from "react";
import TextInput from '@components/TextInput';
import Button from '@components/Button';

function SystemForm({ onSuccess, successUrl }: { onSuccess?: (data: unknown) => void, successUrl?: string }) {
    const [state, action, isPending] = useActionState(
        withState(actions.systems.createSystem),
        { data: undefined, error: undefined } as any
    );

    useEffect(() => {
        if (state?.data) {
            if (onSuccess) {
                onSuccess(state.data);
            }
            if (successUrl) {
                window.location.href = successUrl;
            }
        }
    }, [state, onSuccess, successUrl]);

    return (
        <form action={action} className="gap-2">
            <div className="flex-1">
                <TextInput
                    id="name"
                    name="name"
                    label="System Name"
                    placeholder="Enter system name"
                    error={state.error?.message}
                    maxLength={100}
                    required
                />
            </div>
            <div className="flex items-end py-2">
                <Button
                    type="submit"
                    label={isPending ? 'Creating...' : 'Create'}
                    disabled={isPending}
                    additionalClasses="btn-primary"
                />
            </div>
        </form>
    );
}

export default SystemForm;