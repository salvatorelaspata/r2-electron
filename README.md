# R2 Dashboard

This app helps you monitor your R2 buckets. It's a simple dashboard that displays the stats for each bucket.

## Features

- Monitor your R2 buckets
- Get stats for a specific bucket
- Get all stats for all buckets
- Get the list of buckets

# Configuration

You need to set the following environment variables:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

You can get the `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` from the R2 console.

Create a `.env` file and set the following variables:

```bash
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
```

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
