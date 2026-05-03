const milestones = [
  'Define ticket data model',
  'Add create/read ticket flows',
  'Connect persistence layer'
];

export default function App() {
  return (
    <main>
      <h1>Ramen Tickets MVP</h1>
      <p>
        Issue 0 and Issue 1 establish the frontend baseline for the ramen ticketing product.
      </p>
      <h2>Next milestones</h2>
      <ul>
        {milestones.map((milestone) => (
          <li key={milestone}>{milestone}</li>
        ))}
      </ul>
    </main>
  );
}
