import {  SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    // Tailwind classes for full screen, centering, and a WHITE background
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <SignUp
        afterSignUpUrl="/dashboard"
        appearance={{
          // Variables for a light black/white/gray theme that sits on a white page
          variables: {
            colorPrimary: 'black', // Primary interactive elements (e.g., main button)
            colorText: 'hsl(0, 0%, 15%)',   // Dark gray for main text
            colorBackground: 'hsl(0, 0%, 98%)', // Very light gray for the component's main background (almost white)
            colorInputBackground: 'white', // White for input fields
            colorInputText: 'hsl(0, 0%, 15%)', // Dark gray text within input fields
            colorDanger: 'hsl(0, 80%, 50%)', // Red for errors
            colorSuccess: 'hsl(120, 80%, 40%)', // Green for success

            fontFamily: 'Inter, sans-serif',
            borderRadius: '0.375rem',
          },
          // Element-specific overrides for fine-tuning the look
          elements: {
            card: {
              backgroundColor: 'hsl(0, 0%, 95%)', // Light gray for the sign-in card itself
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // Subtle light shadow
              border: '1px solid hsl(0, 0%, 85%)', // A subtle light gray border
              width: '100%',
              maxWidth: '400px',
              padding: '1.5rem',
            },
            formFieldLabel: {
              color: 'hsl(0, 0%, 30%)', // Darker gray for labels
              marginBottom: '0.5rem',
            },
            formFieldInput: {
              backgroundColor: 'white',
              color: 'hsl(0, 0%, 15%)', // Dark text in inputs
              border: '1px solid hsl(0, 0%, 75%)', // Light gray border for inputs
              padding: '0.75rem 1rem',
              '&:focus': {
                borderColor: 'hsl(0, 0%, 50%)', // Medium gray border on focus
                boxShadow: 'none',
              },
              borderRadius: '0.375rem',
            },
            formButtonPrimary: {
              backgroundColor: 'black', // Black primary button
              color: 'white',
              '&:hover': {
                backgroundColor: 'hsl(0, 0%, 20%)', // Dark gray on hover
              },
              boxShadow: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
            },
            socialButtonsBlockButton: {
              backgroundColor: 'hsl(0, 0%, 90%)', // Light gray for social buttons
              color: 'hsl(0, 0%, 25%)', // Dark gray text for social buttons
              '&:hover': {
                backgroundColor: 'hsl(0, 0%, 80%)',
              },
              boxShadow: 'none',
              border: '1px solid hsl(0, 0%, 80%)',
              borderRadius: '0.375rem',
            },
            dividerLine: {
              backgroundColor: 'hsl(0, 0%, 70%)', // Medium gray divider
            },
            dividerText: {
              color: 'hsl(0, 0%, 50%)', // Medium gray divider text
            },
            footerActionText: {
              color: 'hsl(0, 0%, 40%)',
            },
            footerActionLink: {
              color: 'black', // Black link
              '&:hover': {
                textDecoration: 'underline',
              },
              fontWeight: '500',
            },
            headerTitle: {
              color: 'black',
              fontSize: '1.875rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
            },
            headerSubtitle: {
              color: 'hsl(0, 0%, 40%)',
              fontSize: '1rem',
              marginBottom: '1.5rem',
            },
          },
        }}
      />
    </div>
  );
}