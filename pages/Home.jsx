import React from 'react';
import NewEvaluation from './NewEvaluation';

/**
 * This Home page serves as the main entry point for the application.
 * It renders the NewEvaluation component, ensuring that users who land on the root URL
 * (e.g., when launching from a homescreen shortcut) are directed to the evaluation form.
 * This page is completely public and doesn't require any authentication.
 */
export default function Home() {
  return <NewEvaluation />;
}